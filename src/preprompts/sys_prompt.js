import generate from "./generate.js";
import philosophy from "./philosophy.js";

const sys_prompt =`${generate}\nUseful to know:\n${philosophy}`

export default sys_prompt;