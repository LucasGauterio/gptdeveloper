import qa from "../preprompts/qa.js";
import generate from "../preprompts/generate.js";
import philosophy from "../preprompts/philosophy.js";
import use_qa from "../preprompts/use_qa.js";
import { to_files } from "./ChatToFiles.js";

const Config = {
  DEFAULT: "default",
  BENCHMARK: "benchmark",
  SIMPLE: "simple",
  TDD: "tdd",
  TDD_PLUS: "tdd+",
  CLARIFY: "clarify",
  RESPEC: "respec",
  EXECUTE_ONLY: "execute_only",
  USE_FEEDBACK: "use_feedback",
};
function setup_sys_prompt() {
  return generate + "\nUseful to know:\n" + philosophy;
}
async function clarify(ai, messages, workspace, prompt) {
  console.log("clarify");
  let user = prompt;
  var new_messages = [];
  if (prompt.toLowerCase().startsWith("user clarifications:")) {
    if (prompt !== "") {
      user +=
        "\n\n" +
        "Is anything else unclear? If yes, only answer in the form:\n" +
        "{remaining unclear areas} remaining questions.\n" +
        "{Next question}\n" +
        'If everything is sufficiently clear, only answer "no".';
    }
  } else {
    new_messages = [ai.fsystem(qa)];
  }
  new_messages = await ai.next(new_messages, user);
  const response = {
    messages: messages.concat(new_messages),
    workspace: { ...workspace },
  };
  console.log("clarify", response);
  return response;
}
async function gen_clarified_code(ai, messages, workspace, prompt) {
  console.log("gen_clarified_code");
  var new_messages = [ai.fsystem(setup_sys_prompt())].concat(messages.slice(1));
  new_messages = await ai.next(new_messages, use_qa);
  let new_workspace = to_files(
    new_messages[new_messages.length - 1]["content"]
  );

  const response = {
    messages: messages.concat(new_messages),
    workspace: { ...workspace, ...new_workspace },
  };
  console.log("gen_clarified_code", response);
  return response;
}
async function gen_entrypoint(ai, messages, workspace, prompt) {
  console.log("gen_entrypoint");
  let new_messages = await ai.start(
    "You will get information about a codebase that is currently on disk in " +
      "the current folder.\n" +
      "From this you will answer with code blocks that includes all the necessary " +
      "unix terminal commands to " +
      "a) install dependencies " +
      "b) run all necessary parts of the codebase (in parallell if necessary).\n" +
      "Do not install globally. Do not use sudo.\n" +
      "Do not explain the code, just give the commands.\n" +
      "Do not use placeholders, use example values (like . for a folder argument) " +
      "if necessary.\n",
    "Information about the codebase:\n\n" + workspace["all_output.txt"]
  );
  const regex = /```([^]+?)```/g;
  const matches = Array.from(
    new_messages[new_messages.length - 1]["content"].matchAll(regex)
  );
  let new_workspace = {
    "run.sh": matches.map((match) => match[1]).join("\n") 
  };

  const response = {
    messages: messages.concat(new_messages),
    workspace: { ...workspace, ...new_workspace },
  };
  console.log("gen_entrypoint", response);
  return response;
}

export default {
  STEPS: {
    default: [clarify, gen_clarified_code, gen_entrypoint],
  },
};
