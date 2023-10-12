import { withSessionAPI } from "@/lib/session";
import { login } from "@/lib/auth";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

const handler: NextApiHandler = async (
  request: NextApiRequest,
  response: NextApiResponse
) => {
  try {
    const userId = await login(request);
    request.session.userId = userId;
    await request.session.save();

    response.status(200).json(userId);
  } catch (error: any) {
    response.status(500).json({ message: error.message });
  }
};

export default withSessionAPI(handler);
