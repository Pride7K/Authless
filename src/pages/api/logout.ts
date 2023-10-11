import { withSessionAPI } from "@/lib/session";

function handler(request, response) {
  request.session.destroy();
  response.setHeader("location", "/login");
  response.statusCode = 302;
  response.end();
}

export default withSessionAPI(handler);