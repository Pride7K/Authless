import mongoose from "mongoose";

const CredentialsSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  externalId: {
    type: String,
    unique: true,
  },
  publicKey: {
    type: String,
  },
  dateAdded: {
    type: Date,
    default: Date.now(),
  },
});

export default mongoose.models.Credentials ||
  mongoose.model("Credentials", CredentialsSchema);