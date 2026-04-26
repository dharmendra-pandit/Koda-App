import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
  {
    doubtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doubt",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reply",
      default: null,
    },
    text: {
      type: String,
      required: [true, "Reply text is required"],
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isAccepted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Reply = mongoose.model("Reply", replySchema);
export default Reply;
