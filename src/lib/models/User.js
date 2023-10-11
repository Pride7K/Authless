import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
  },
  username: {
    type: String,
    unique: true,
  },
  credentials: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Credentials",
    },
  ],
});

export default mongoose.models.User || mongoose.model("User", UserSchema);