const prompt = `You will get information about a codebase that is currently on disk in 
the current folder.\n
From this you will answer with code blocks that includes all the necessary 
dos and unix terminal commands to 
a) install dependencies 
b) run all necessary parts of the codebase (in parallel if necessary).\n
Do not install globally. Do not use sudo.\n
Do not explain the code, just give the commands.\n
Do not use placeholders, use example values (like . for a folder argument) 
if necessary.\n`;

export default prompt;
