import dbConnect from "@/lib/dbConnect";
import user from "../../lib/models/user";

export default async function handler(req, res) {
  await dbConnect();
  const { email, username } = req.body;

  const userExists = await user.findOne({
    $or: [{ email: email }, { username: username }],
  });

  if (userExists) {
    res.status(400).json({ message: "User already exists" });
  } else {
    res.status(200).json({ message: "User available" });
  }
}