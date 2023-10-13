import { withSessionAPI } from "@/lib/session";

import user from "../../lib/models/user";
import credentials from "../../lib/models/Credential";
import { verifyCredentials } from "../../lib/auth";
import dbConnect from "@/lib/dbConnect";
import { NextApiHandler } from "next";

const handler: NextApiHandler = async (request, response) => {
  try {
    await dbConnect();

    console.log("entrou")

    const { credentialID, publicKey } = await verifyCredentials(request);

    console.log("Credential ID: ", credentialID);

    console.log("Public Key: ", publicKey);

    const cred = await credentials.create({
      name: request.body.username,
      externalId: credentialID,
      publicKey: publicKey,
    });
    const usr = await user.create({
      email: request.body.email,
      username: request.body.username,
      credentials: [cred.id],
    });

    console.log("User: ", usr)

    request.session.userId = usr._id;
    await request.session.save();
    response.status(200).json({ userId: usr._id });
  } catch (error: any) {
    response.status(500).json({ message: error.message });
  }
};

export default withSessionAPI(handler);
