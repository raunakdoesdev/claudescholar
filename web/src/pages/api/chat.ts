import { AnthropicStream, StreamingTextResponse } from "ai";
import { env } from "~/env.mjs";

export const runtime = "edge";

export interface Message {
  content: string;
  role: "user" | "assistant";
}

const prompt = (additional_data: string, functions: string) =>
  `You are an expoert biology and chemistry research assistant that will help me by following the following instructions:
I may provide you with various documents for context. This content could include research papers, PDB files which represent a protein structure, and other file types. Researchers may ask you to synthesize information from these documents, or ask questions about what they contain, and you should always aim to answer truthfully from the document when possible.
I may also ask you to perform certain tasks that would require calling one of the functions from <functions> noted below. Every function, noted by <function-name> has a description <function-description> what the function does and what types of prompts should lead you to choose that function. It also includes <function-parameters> which has multiple required parameters with a name <parameter-name>. Each parameter has a field <parameter-desc> which describes the structure of that parameter. You must include all required parameters in your output and you should use my input to extract what values they intended to use for that function. If you're not sure, you can ask the user follow up questions before calling the function.
The set of possible functions for you to call is:

${functions}

Under no circumstances should you call any other functions outside of the list specified above. It won't work.

When the researcher’s prompt seems to match <function-description> for one of the options in <functions>, you should extract the values for all required parameters as <parameter-value> and write a response formatted with the following XML structure:

<function-call>
	<function-name>function name<function-name>
	<parameter>
		<parameter-name>First Parameter Name<parameter-name>
		<parameter-value>First Parameter Value<parameter-value>
	</parameter>
	<parameter>
		<parameter-name>Second Parameter Name<parameter-name>
		<parameter-value>Second Parameter Value<parameter-value>
	</parameter>
</function-call>` +
  // For example, if a user were to write:
  // Input: “Can protein 6w70 bind with SMILES code C0c1ccc(cc1)n2c3c(c(n2)C(=O)N)CCN(C3=O)c4ccc(cc4)N5CCCCC5=O?”
  // You could output (if this tool existed):
  // “
  // <function-call>
  // 	<function-name>DiffDock<function-name>
  // 	<parameter>
  // 		<parameter-name>pdb_code<parameter-name>
  // 		<parameter-value>6w70<parameter-value>
  // 	</parameter>
  // 	<parameter>
  // 		<parameter-name>smiles_code<parameter-name>
  // <parameter-value>C0c1ccc(cc1)n2c3c(c(n2)C(=O)N)CCN(C3=O)c4ccc(cc4)N5CCCCC5=O<parameter-value>
  // 	</parameter>
  // </function-call>

  `If there are no parameters required, you may simply omit the data. Additionally, the user may want you to include some context of different documents to inform your response. This is the additional data: ${additional_data}
`;

function buildPrompt(
  messages: Message[],
  additional_data: string,
  functions: string
) {
  return (
    prompt(additional_data, functions) +
    "\n\n" +
    messages
      .map(({ content, role }) => {
        if (role === "user") {
          return `Human: ${content}`;
        } else {
          return `Assistant: ${content}`;
        }
      })
      .join("\n\n") +
    "Assistant:"
  );
}

export default async function handler(req: Request, res: Response) {
  const { messages, additional_data, functions } = await req.json();

  const response = await fetch("https://api.anthropic.com/v1/complete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
    },
    body: JSON.stringify({
      prompt: buildPrompt(messages, additional_data, functions),
      model: "claude-2.0",
      max_tokens_to_sample: 300,
      temperature: 0.9,
      stream: true,
    }),
  });

  if (!response.ok) {
    return new Response(await response.text(), {
      status: response.status,
    });
  }

  const stream = AnthropicStream(response);
  return new StreamingTextResponse(stream);
}
