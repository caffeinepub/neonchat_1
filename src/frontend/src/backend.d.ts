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
    userName: string;
    userRank: string;
    userId: string;
    text: string;
    timestamp: bigint;
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
    Employee = "Employee",
    Admin = "Admin",
    Friend = "Friend"
}
export interface backendInterface {
    askAI(prompt: string): Promise<string>;
    assignRank(adminUserId: string, targetUserId: string, rank: Rank): Promise<boolean>;
    getDMs(userId: string, _otherUserId: string): Promise<Array<Message>>;
    getMessages(since: bigint): Promise<Array<Message>>;
    getUserRank(userId: string): Promise<string>;
    getUsers(): Promise<Array<User>>;
    registerUser(name: string): Promise<string>;
    sendDM(fromUserId: string, toUserId: string, text: string): Promise<bigint>;
    sendMessage(userId: string, text: string): Promise<bigint>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateLastSeen(userId: string): Promise<void>;
    verifyCode(code: string): Promise<boolean>;
}
