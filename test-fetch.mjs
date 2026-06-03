import fetch from 'node-fetch';

async function test() {
   const res = await fetch('http://localhost:3000/api/generate-text', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Hello", model: "gemini-2.5-flash" })
   });
   console.log(res.status, await res.text());
}
test().catch(console.error);
