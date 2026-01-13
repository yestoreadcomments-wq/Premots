export default function handler(req, res) {
  res.setHeader("Content-Type", "text/plain");
  res.status(200).send(`
print("hello from github + vercel")
print("this script is hosted remotely")
  `);
}
