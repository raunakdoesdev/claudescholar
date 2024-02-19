# Claude Scholar

Powered by [Oloren AI's Orchestrator](oloren.ai).
First place prize at Anthropic's hackathon

## The Problem
Biology research is often slow and tedious due to the vast amount of literature that must be cross-referenced to generate ideas, and the time-intensive simulations needed to narrow down options. Researchers waste countless hours combing through papers just to find promising protein and molecule combinations to investigate. Once they finally identify potential candidates, they must run lengthy conventional simulations to determine if binding and other molecular interactions will be successful. 

This problem is difficult to address with other language models because it requires a context window large enough to consider multiple literature sources and the ability to call many different functions. Truly solving it would also require incorporating the current state of the art from research institutions in protein folding and molecular simulations, which is often not accessible to biology researchers with limited software experience. 

## Our Solution

ClaudeScholar is a tool that allows researchers to upload or search any context that is relevant to their research, and then interact with that information with a natural chat interface. Users can search through any document with natural language, uncover insights across multiple research papers, and even task the AI assistant with complicated workflows like generating new compounds and modeling protein interactions using state of the art research such as RFDiffusion.

Claude 2’s large context window allows us to achieve this with sufficient context, and also requires little effort from the researcher to trigger agent actions. Our system prompt allows Claude to interpret when a user’s prompt matches an available function, and we designed ClaudeScholar to be able to support new actions easily. 

In summary, ClaudeScholar lets you:
- Upload relevant research, PDB files, and other content for Claude to use as context
- Search for authoritative context through PubMed
- Query, Summarize, and Synthesize information across your content
- Visualize proteins 
- Generate new molecules that can bind to a given protein using RFDiffusion
- Convert PDF to Text instantly
- Find similar molecules and add them to the conversation
- And a lot more!


## How we built it
![System Diagram](https://i.imgur.com/tYkOO1n.png)

Github: https://github.com/sauhaardac/bioclaude

## Challenges we ran into and what we learned from them
- Adding diffdock was a huge challenge, we spent hours managing dependencies. We realized that scientists have to go through the same trouble, and they don't have the same experience with computer science tools as we do. It made us realize how important this work of making computational tools more accessible and easy to use for scientists was.
- We initially had trouble with hallucinations, but we were able to solve this both by giving the LLM tools in XML format and by incorporating documents and summaries into our model.
- We found it difficult to prompt the model to call functions initially, but the talk on the prompting workshop gave us great advice on how to prompt with XML that helped greatly.

## What's next for ClaudeScholar

With a few improvements we really believe that this could be a useful tool for biology researchers. These improvements would include: 

Adding support for additional tools such as AlphaFold
Adding a toxicology filter to prevent the use of ClaudeScholar for harmful reasons. 
Reduce latency for our API calls to make the chat experience faster
Prompt engineering improvements to improve accuracy of actions

## Acknowledgements 
We would like to thank and acknowledge the creators of many of the tools and projects that were used in this work. We were truly standing on the shoulders of giants.
- [David Huang](https://twitter.com/dhuang26) for his help overall and implementation of CrEM algorithm used for muatations!
- [Oloren Orchestrator](https://oloren.ai) for building and deploying the backend workflows
- [Mol*](molstar.org) tool for protein visualization
- [EPAM](https://lifescience.opensource.epam.com/ketcher/index.html) for their open source molecular editor, Ketcher
- [Vercel](vercel.com) for both Next.js framework + deployment
