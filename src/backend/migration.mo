import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Int "mo:core/Int";

module {
  type OldActor = {
    nextMessageId : Nat;
    nextUserId : Nat;
    users : Map.Map<Text, OldUser>;
    publicMessages : List.List<OldMessage>;
    directMessages : Map.Map<Text, List.List<OldMessage>>;
    verificationArray : [(Text, Text)];
  };

  type OldUser = {
    id : Text;
    name : Text;
    lastSeen : Int;
  };

  type OldMessage = {
    id : Nat;
    userId : Text;
    userName : Text;
    text : Text;
    timestamp : Int;
  };

  type Rank = {
    #Admin;
    #Employee;
    #Friend;
  };

  type NewActor = {
    nextMessageId : Nat;
    nextUserId : Nat;
    users : Map.Map<Text, NewUser>;
    publicMessages : List.List<NewMessage>;
    directMessages : Map.Map<Text, List.List<NewMessage>>;
    verificationArray : [(Text, Text)];
  };

  type NewUser = {
    id : Text;
    name : Text;
    lastSeen : Int;
    rank : Rank;
  };

  type NewMessage = {
    id : Nat;
    userId : Text;
    userName : Text;
    text : Text;
    timestamp : Int;
    userRank : Text;
  };

  public func run(old : OldActor) : NewActor {
    let newUsers = old.users.map<Text, OldUser, NewUser>(
      func(_id, oldUser) {
        {
          id = oldUser.id;
          name = oldUser.name;
          lastSeen = oldUser.lastSeen;
          rank = #Friend;
        };
      }
    );

    let newPublicMessages = old.publicMessages.map<OldMessage, NewMessage>(
      func(oldMessage) {
        {
          id = oldMessage.id;
          userId = oldMessage.userId;
          userName = oldMessage.userName;
          text = oldMessage.text;
          timestamp = oldMessage.timestamp;
          userRank = "Friend";
        };
      }
    );

    let newDirectMessages = old.directMessages.map<Text, List.List<OldMessage>, List.List<NewMessage>>(
      func(_id, oldMessages) {
        oldMessages.map<OldMessage, NewMessage>(
          func(oldMessage) {
            {
              id = oldMessage.id;
              userId = oldMessage.userId;
              userName = oldMessage.userName;
              text = oldMessage.text;
              timestamp = oldMessage.timestamp;
              userRank = "Friend";
            };
          }
        );
      }
    );

    {
      old with
      users = newUsers;
      publicMessages = newPublicMessages;
      directMessages = newDirectMessages;
    };
  };
};
