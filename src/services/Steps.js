import qa from "../preprompts/qa.js";
import generate from "../preprompts/generate.js";
import philosophy from "../preprompts/philosophy.js";
import use_qa from "../preprompts/use_qa.js";
import {to_files} from "./ChatToFiles.js";

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
function setup_sys_prompt(){
    return (
        generate + "\nUseful to know:\n" + philosophy
    )
}
function clarify(mainPrompt, ai) {
  //const messages = [ai.fsystem(dbs.preprompts["qa"])];
  var messages = [ai.fsystem(qa)];
  //let user = dbs.input["main_prompt"];
  let user = mainPrompt;
  messages = ai.next(messages, user);
  return messages;
}
function clarifyContinue(mainPrompt, ai, messages) {
  //const messages = [ai.fsystem(dbs.preprompts["qa"])];
  //let user = dbs.input["main_prompt"];
  let user = mainPrompt;
  if (mainPrompt !== "") {
    user +=
      "\n\n" +
      "Is anything else unclear? If yes, only answer in the form:\n" +
      "{remaining unclear areas} remaining questions.\n" +
      "{Next question}\n" +
      'If everything is sufficiently clear, only answer "no".';
    messages = ai.next(messages, user);
  }

  return messages;
}
function gen_clarified_code(ai, messages, workspace) {
    messages = [
        ai.fsystem(setup_sys_prompt()),
    ].concat(messages.slice(1))
    messages = ai.next(messages, use_qa)
    to_files(messages[messages.length - 1]["content"], workspace);
    return messages
}
function gen_entrypoint() {}
function execute_entrypoint() {}

export default {
  STEPS: {
    default: [
      clarify,
      clarifyContinue,
      gen_clarified_code,
      gen_entrypoint,
      execute_entrypoint,
    ],
  },
};
