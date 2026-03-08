import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface Message {
    id: bigint;
    userName: string;
    userId: string;
    text: string;
    timestamp: bigint;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface User {
    id: string;
    name: string;
    lastSeen: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface backendInterface {
    askAI(prompt: string): Promise<string>;
    getDMs(userId: string, otherUserId: string): Promise<Array<Message>>;
    getMessages(since: bigint): Promise<Array<Message>>;
    getUsers(): Promise<Array<User>>;
    registerUser(name: string): Promise<string>;
    sendDM(fromUserId: string, toUserId: string, text: string): Promise<bigint>;
    sendMessage(userId: string, text: string): Promise<bigint>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateLastSeen(userId: string): Promise<void>;
    verifyCode(code: string): Promise<boolean>;
}
