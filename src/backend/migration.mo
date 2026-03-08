import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";

module {
  type Rank = {
    #Admin;
    #Employee;
    #Friend;
    #VIP;
  };

  type Message = {
    id : Nat;
    userId : Text;
    userName : Text;
    text : Text;
    timestamp : Int;
    userRank : Text;
    replyToId : ?Nat;
    replyToText : ?Text;
    edited : Bool;
  };

  type User = {
    id : Text;
    name : Text;
    lastSeen : Int;
    rank : Rank;
  };

  type BanRecord = {
    userId : Text;
    expiresAt : Int;
    reason : Text;
  };

  type OldActor = {
    nextMessageId : Nat;
    nextUserId : Nat;
    users : Map.Map<Text, User>;
    publicMessages : List.List<Message>;
    directMessages : Map.Map<Text, List.List<Message>>;
    bans : Map.Map<Text, BanRecord>;
    accessCode : Text;
    splash : Text;
    verificationArray : [(Text, Text)];
  };

  type NewActor = {
    nextMessageId : Nat;
    nextUserId : Nat;
    users : Map.Map<Text, User>;
    publicMessages : List.List<Message>;
    directMessages : Map.Map<Text, List.List<Message>>;
    bans : Map.Map<Text, BanRecord>;
    accessCode : Text;
    splash : Text;
    verificationArray : [(Text, Text)];
    versionString : Text;
  };

  public func run(old : OldActor) : NewActor {
    { old with versionString = "v2.4.1" };
  };
};
