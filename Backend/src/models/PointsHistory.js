import mongoose from "mongoose";

const pointsHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      required: true,
      enum: [
        "study_session",
        "chapter_complete",
        "reply_posted",
        "reply_upvoted",
        "reply_accepted",
      ],
    },
    points: {
      type: Number,
      required: true,
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null, // reference to session/chapter/reply
    },
  },
  { timestamps: true }
);

const PointsHistory = mongoose.model("PointsHistory", pointsHistorySchema);
export default PointsHistory;
