"use client"

import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";

enum CallStatus {
    INACTIVE = "INACTIVE",
    CONNECTING = "CONNECTING",
    ACTIVE = "ACTIVE",
    FINISHED = "FINISHED",
}

interface SavedMessage {
    role: "user" | "system" | "assistant";
    content: string;
}

const Agent = ({ userId, userName, type, interviewId, questions } : AgentProps) => {
    const router = useRouter();

    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [lastMessage, setLastMessage] = useState<string>("");
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);

    useEffect(() => {
        const onCallStart = () => setCallStatus(CallStatus.ACTIVE);
        const onCallEnd = () => setCallStatus(CallStatus.FINISHED);

        const onMessage = (message: Message) => {
            if (message.type === "transcript" && message.transcriptType === "final") {
                const newMessage = { role: message.role, content: message.transcript };

                setMessages((prev) => [...prev, newMessage]);
            }
        };

        const onSpeechStart = () => setIsSpeaking(true);
        const onSpeechEnd = () => setIsSpeaking(false);

        const onError = (error: Error) => console.log("Error", error);

        vapi.on("call-start", onCallStart);
        vapi.on("call-end", onCallEnd);
        vapi.on("message", onMessage);
        vapi.on("speech-start", onSpeechStart);
        vapi.on("speech-end", onSpeechEnd);
        vapi.on("error", onError);

        return () => {
            vapi.off("call-start", onCallStart);
            vapi.off("call-end", onCallEnd);
            vapi.off("message", onMessage);
            vapi.off("speech-start", onSpeechStart);
            vapi.off("speech-end", onSpeechEnd);
            vapi.off("error", onError);
        }
    }, []);

    useEffect(() => {
        if (messages.length > 0) setLastMessage(messages[messages.length - 1].content)
        
        const handleGenerateFeedback = async (messages: SavedMessage[]) => {
            console.log("handleGenerateFeedback");

            const { success, id } = {
                success: true,
                id: "id"
            }

            if (success && id) router.push(`/interview/${interviewId}/feedback`);

            console.log("Error saving feedback here.");
            
            router.push("/");
        }
        
        if (callStatus === CallStatus.FINISHED) {
            if (type === "generate") router.push("/");

            handleGenerateFeedback(messages);
        }
    }, [messages, callStatus, type, router, userId, interviewId]);
    
    const handleCall = async () => {
        setCallStatus(CallStatus.CONNECTING);

        if (type === "generate") {
            return await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
                variableValues: {
                    username: userName,
                    userid: userId,
                }
            });
        }
        
        let formattedQuestions = "";
        if (questions) {
            formattedQuestions = questions.map((question) => {`- ${question}`}).join("\n");
        }
        
        return await vapi.start(interviewer, {
            variableValues: {
                questions: formattedQuestions,
            }
        })
    }

    const handleDisconnect = async () => {
        setCallStatus(CallStatus.FINISHED);

        vapi.stop();
    }
    
    const isCallInactiveOrFinished = callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED;

    return (
        <>
            <div className={"call-view"}>
                <div className={"card-interviewer"}>
                    <div className={"avatar"}>
                        <Image src={"/ai-avatar.png"} alt={"Vapi"} width={65} height={54} className={"object-cover"}/>
                        { isSpeaking && <span className={"animate-speak"}></span> }
                    </div>
                    <h3>AI Interviewer</h3>
                </div>
                <div className={"card-border"}>
                    <div className={"card-content"}>
                        <Image src={"/user-avatar.png"} alt={"user avatar"} width={540} height={540} className={"size-[120px] rounded-full object-cover"}/>
                        <h3>{ userName }</h3>
                    </div>
                </div>
            </div>
            { messages.length > 0 && (
                <div className={"transcript-border"}>
                    <div className={"transcript"}>
                        <p key={lastMessage} className={cn("transition-opacity duration-500 opacity-0", "animate-fadeIn opacity-100")}>
                            { lastMessage }
                        </p>
                    </div>
                </div>
            ) }
            <div className={"w-full flex justify-center"}>
                { callStatus !== "ACTIVE" ? (
                    <button className={"btn-call relative"} onClick={handleCall}>
                        <span className={cn(callStatus !== "CONNECTING" && "hidden", "absolute animate-ping rounded-full opacity-75")} />
                        <span>
                            { isCallInactiveOrFinished ? "Call" : "..." }
                        </span>
                    </button>
                ) : (
                    <button className={"btn-disconnect"} onClick={handleDisconnect}>
                        End
                    </button>
                ) }
            </div>
        </>
    )
}

export default Agent;
