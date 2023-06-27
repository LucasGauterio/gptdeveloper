export const parse_chat = (chat) => {
  const regex = /(\S+)\n\s*```[^\n]*\n([\s\S]+?)```/g;
  const files = [];
  let match;

  while ((match = regex.exec(chat)) !== null) {
    // Strip the filename of any non-allowed characters and convert / to \
    let path = match[1].replace(/[<>"|?*]/g, "");
    // Remove leading and trailing brackets
    path = path.replace(/^\[(.*)\]$/, "$1");
    // Remove leading and trailing backticks
    path = path.replace(/^`(.*)`$/, "$1");
    
    // Remove trailing ]
    path = path.replace(/\]$/, "");
    
    // Get the code
    const code = match[2];
    // Add the file to the list
    files.push([path, code]);
  }

  // Get all the text before the first ``` block
  const readme = chat.split("```")[0];
  files.push(["README.md", readme]);

  // Return the files
  return files;
}

export const to_files = (chat, workspace) => {
  workspace["all_output.txt"] = chat;

  const files = parse_chat(chat);
  for (const [file_name, file_content] of files) {
    workspace[file_name] = file_content;
  }
}