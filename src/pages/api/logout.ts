import { withSessionAPI } from "@/lib/session";
import { Request, Response } from "express";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

const handler: NextApiHandler = (request: NextApiRequest, response: NextApiResponse) => {
  request.session.destroy();
  response.setHeader("location", "/login");
  response.statusCode = 302;
  response.end();
};

export default withSessionAPI(handler);