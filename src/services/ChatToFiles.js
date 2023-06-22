export function parse_chat(chat) {
  const regex = /(\S+)\n\s*###[^\n]*\n([\s\S]+?)```/g;
  const files = [];
  let match;

  while ((match = regex.exec(chat)) !== null) {
    let path = match[1].replace(/[<>"|?*]/g, "");
    path = path.replace(/^\[(.*)\]$/, "$1");
    path = path.replace(/^`(.*)`$/, "$1");
    path = path.replace(/\]$/, "");
    const code = match[2];
    files.push([path, code]);
  }

  const readme = chat.split("###")[0];
  files.push(["README.md", readme]);

  return files;
}

export function to_files(chat, workspace) {
  workspace["all_output.txt"] = chat;

  const files = parse_chat(chat);
  for (const [file_name, file_content] of files) {
    workspace[file_name] = file_content;
  }
}
