import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface User {
    id: string;
    name: string;
    rank: Rank;
    lastSeen: bigint;
}
export interface Message {
    id: bigint;
    replyToText?: string;
    userName: string;
    userRank: string;
    edited: boolean;
    userId: string;
    text: string;
    timestamp: bigint;
    replyToId?: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export enum Rank {
    VIP = "VIP",
    Employee = "Employee",
    Admin = "Admin",
    Friend = "Friend"
}
export interface backendInterface {
    askAI(prompt: string): Promise<string>;
    assignRank(adminUserId: string, targetUserId: string, rank: Rank): Promise<boolean>;
    banUser(adminUserId: string, targetUserId: string, durationMinutes: bigint, reason: string): Promise<boolean>;
    checkBan(userId: string): Promise<{
        expiresAt: bigint;
        banned: boolean;
        reason: string;
    }>;
    deleteMessage(adminUserId: string, messageId: bigint): Promise<boolean>;
    editMessage(adminUserId: string, messageId: bigint, newText: string): Promise<boolean>;
    getDMs(userId: string, _otherUserId: string): Promise<Array<Message>>;
    getMessages(since: bigint): Promise<Array<Message>>;
    getSplash(): Promise<string>;
    getUserRank(userId: string): Promise<string>;
    getUsers(): Promise<Array<User>>;
    registerUser(name: string): Promise<string>;
    sendDM(fromUserId: string, toUserId: string, text: string): Promise<bigint>;
    sendMessage(userId: string, text: string, replyToId: bigint | null, replyToText: string | null): Promise<bigint>;
    setSplash(adminUserId: string, text: string): Promise<boolean>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateLastSeen(userId: string): Promise<void>;
    verifyCode(code: string): Promise<boolean>;
}
