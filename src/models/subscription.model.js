import mongoose, {Schema} from "mongoose"
const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, //one who is subcribing 
        ref: "User"
    },
    channel: {
        type: Suchema.Types.ObjectId, // one whom is subscribing 
        ref: "User"
    }

},  {timestamps: true})


export const Subsription   = mongoose.model("Subscription", subscriptionSchema)