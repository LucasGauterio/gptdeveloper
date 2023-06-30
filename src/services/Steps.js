import { to_files } from "./ChatToFiles.js";

export const Configurations = {
  DEFAULT: "default",
  BENCHMARK: "benchmark",
  SIMPLE: "simple",
  TDD: "tdd",
  TDD_PLUS: "tdd+",
  CLARIFY: "clarify",
  RESPEC: "respec",
  EXECUTE_ONLY: "execute_only",
  USE_FEEDBACK: "use_feedback",
}

function setup_sys_prompt(dbs) {
  if (dbs) {
    return dbs.preprompts.sys_prompt
  }
  return dbs.preprompts.generate + "\nUseful to know:\n" + dbs.preprompts.philosophy
}

function get_prompt(dbs) {
  if (dbs.prompts.prompt) {
    return dbs.prompts.prompt
  }
  return dbs.prompts.main_prompt
}

async function simple_gen(ai, dbs) {
  dbs.messages = await ai.start(setup_sys_prompt(dbs), get_prompt(dbs))
  to_files(
    dbs.messages[dbs.messages.length - 1].content, dbs.workspace
  )
}

async function clarify(ai, dbs) {
  //Ask the user if they want to clarify anything and save the results to the workspace
  let user = get_prompt(dbs)
  var prompt = dbs.prompts.prompt || ""
  var hasAnswer = prompt.toLowerCase().startsWith("user clarifications:")
  var skip = prompt.toLowerCase() === "skip"

  if (hasAnswer) {
    user += dbs.preprompts.qa_unclear
  } else if (skip) {
    user = dbs.preprompts.qa_assumptions
  } else {
    dbs.messages = [ai.fsystem(dbs.preprompts.qa)]
  }
  await ai.next(dbs.messages, user)
}

async function gen_spec(ai, dbs) {
  //Generate a spec from the main prompt + clarifications and save the results the workspace
  dbs.messages = [
    ai.fsystem(setup_sys_prompt(dbs)),
    ai.fsystem(`Instructions: ${dbs.prompts.main_prompt}`)
  ]
  await ai.next(dbs.messages, dbs.preprompts.spec)
  dbs.memory.specification = dbs.messages[dbs.messages.length - 1].content
}

async function gen_clarified_code(ai, dbs) {
  //Takes clarification and generates code
  var messages = [ai.fsystem(setup_sys_prompt(dbs))].concat(dbs.messages.slice(1));
  messages = await ai.next(messages, dbs.preprompts.use_qa);
  messages.forEach(message => dbs.messages.push(message));
  to_files(
    messages[messages.length - 1].content, dbs.workspace
  );
}
async function gen_entrypoint(ai, dbs) {
  let messages = await ai.start(
    dbs.preprompts.entrypoint_system,
    `${dbs.preprompts.entrypoint_user}${dbs.workspace["all_output.txt"]}`
  );
  const regex = /```([^]+?)```/g;
  const matches = Array.from(
    messages[messages.length - 1].content.matchAll(regex)
  );
  dbs.workspace["run.sh"] = matches.map((match) => match[1]).join("\n");
}

async function gen_unit_tests(ai, dbs) {
  //Generate unit tests based on the specification, that should work
  dbs.messages.push(ai.fuser(`${dbs.memory.specification}`))
  let messages = await ai.next(dbs.messages, dbs.preprompts.unit_tests)

  dbs.memory.unit_tests = messages[messages.length - 1].content
  to_files(dbs.memory.unit_tests, dbs.workspace)

}

async function gen_code(ai, dbs) {
  //get the messages from previous step
  let messages = [
      ai.fsystem(setup_sys_prompt(dbs)),
      ai.fuser(`Instructions: ${get_prompt(dbs)}`),
      ai.fuser(`${dbs.memory.specification}`),
      ai.fuser(`Unit tests:\n\n${dbs.memory.unit_tests}`),
  ]
  messages = await ai.next(dbs.messages, dbs.preprompts.use_qa)
  messages.forEach(message => dbs.messages.push(message));
  to_files(messages[messages.length - 1].content, dbs.workspace)
}

export default {
  STEPS: {
    DEFAULT: [
      clarify,
      gen_clarified_code,
      gen_entrypoint,
    ],
    BENCHMARK: [
      simple_gen,
      gen_entrypoint,
    ],
    SIMPLE: [
      simple_gen,
      gen_entrypoint,
    ],
    TDD: [
      gen_spec,
      gen_unit_tests,
      gen_code,
      gen_entrypoint,
    ],
  },
};
