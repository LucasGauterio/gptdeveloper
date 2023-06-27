import { Configuration, OpenAIApi } from "openai";

export default class AI {
  constructor(model = "gpt-4", temperature = 0.1, apiKey) {
    this.temperature = temperature;
    this.model = model;

    var configuration = new Configuration({ apiKey });
    delete configuration.baseOptions.headers["User-Agent"];

    this.openai = new OpenAIApi(configuration);

    this.modelValid = false;
  }

  async validateModel() {
    var message = "";
    try {
      this.modelData = await this.openai.retrieveModel(this.model);
    } catch (error) {
      console.error(error);
      message = `Model ${this.model} not available for provided API key. Reverting to gpt-3.5-turbo. Sign up for the GPT-4 wait list here: https://openai.com/waitlist/gpt-4-api`;
      console.log(message);
      this.model = "gpt-3.5-turbo";
      message = this.validateModel();
    }
    return message;
  }

  start(system, user) {
    const messages = [
      { role: "system", content: system },
      { role: "user", content: user },
    ];

    return this.next(messages);
  }

  fsystem(msg) {
    return { role: "system", content: msg };
  }

  fuser(msg) {
    return { role: "user", content: msg };
  }

  fassistant(msg) {
    return { role: "assistant", content: msg };
  }

  async next(messages, prompt) {
    if (prompt) {
      messages.push({ role: "user", content: prompt });
    }

    console.log(`Creating a new chat completion: ${JSON.stringify(messages)}`);
    try {
        const response = await this.openai.createChatCompletion(
        {
            model: this.model,
            temperature: this.temperature,
            top_p: 1.0,
            messages,
        },
        { timeout: 60000 }
        );
        const response_text = response.data.choices[0].message.content.trim();

        messages.push({"role": "assistant", "content": response_text})

        console.log(`After chat completion: ${JSON.stringify(messages)}`);
    }catch(e){
        console.error(e)
    }
    return messages;
  }
}
