import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Blob "mo:core/Blob";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import OutCall "http-outcalls/outcall";

actor {
  type Message = {
    id : Nat;
    userId : Text;
    userName : Text;
    text : Text;
    timestamp : Int;
  };

  module Message {
    public func compare(message1 : Message, message2 : Message) : Order.Order {
      Nat.compare(message1.id, message2.id);
    };

    public func compareByTimestamp(message1 : Message, message2 : Message) : Order.Order {
      Int.compare(message1.timestamp, message2.timestamp);
    };
  };

  type User = {
    id : Text;
    name : Text;
    lastSeen : Int;
  };

  module User {
    public func compare(user1 : User, user2 : User) : Order.Order {
      switch (Text.compare(user1.name, user2.name)) {
        case (#equal) { Text.compare(user1.id, user2.id) };
        case (order) { order };
      };
    };

    public func compareByLastSeen(user1 : User, user2 : User) : Order.Order {
      Int.compare(user1.lastSeen, user2.lastSeen);
    };
  };

  var nextMessageId = 0;
  var nextUserId = 0;

  let users = Map.empty<Text, User>();
  let publicMessages = List.empty<Message>();
  let directMessages = Map.empty<Text, List.List<Message>>();

  let verificationArray = [
    // Smart move using test array, let's keep this until a fix is out.
    ("MichaelCuUlrichKlein", "1017"),
    ("PascalKlarenberg", "1337"),
  ];

  func generateUserId() : Text {
    nextUserId += 1;
    "user" # nextUserId.toText();
  };

  public func verifyCode(code : Text) : async Bool {
    for ((_, validCode) in verificationArray.values()) {
      if (validCode == code) {
        return true;
      };
    };
    false;
  };

  public shared ({ caller }) func registerUser(name : Text) : async Text {
    let userId = generateUserId();
    let user : User = {
      id = userId;
      name;
      lastSeen = Time.now();
    };
    users.add(userId, user);
    userId;
  };

  public func getUsers() : async [User] {
    users.values().toArray().sort();
  };

  public shared ({ caller }) func updateLastSeen(userId : Text) : async () {
    switch (users.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        let updatedUser : User = {
          id = user.id;
          name = user.name;
          lastSeen = Time.now();
        };
        users.add(userId, updatedUser);
      };
    };
  };

  public shared ({ caller }) func sendMessage(userId : Text, text : Text) : async Nat {
    let message : Message = {
      id = nextMessageId;
      userId;
      userName = getUserName(userId);
      text;
      timestamp = Time.now();
    };

    nextMessageId += 1;

    if (publicMessages.size() >= 500) {
      ignore publicMessages.removeLast();
    };
    publicMessages.add(message);
    message.id;
  };

  func getUserName(userId : Text) : Text {
    switch (users.get(userId)) {
      case (null) { Runtime.trap("User not found!") };
      case (?user) { user.name };
    };
  };

  public func getMessages(since : Int) : async [Message] {
    publicMessages.sort().toArray().filter(
      func(msg) { msg.timestamp > since }
    );
  };

  public shared ({ caller }) func sendDM(fromUserId : Text, toUserId : Text, text : Text) : async Nat {
    let dm : Message = {
      id = nextMessageId;
      userId = toUserId;
      userName = getUserName(fromUserId);
      text;
      timestamp = Time.now();
    };

    nextMessageId += 1;

    let existingMessages = switch (directMessages.get(fromUserId)) {
      case (null) { List.empty<Message>() };
      case (?messages) { messages };
    };

    existingMessages.add(dm);
    directMessages.add(fromUserId, existingMessages);

    dm.id;
  };

  public func getDMs(userId : Text, otherUserId : Text) : async [Message] {
    switch (directMessages.get(userId)) {
      case (null) { [] };
      case (?messages) { messages.sort().toArray() };
    };
  };

  public query({ caller }) func transform(input: OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func askAI(prompt : Text) : async Text {
    let url = "https://api.duckduckgo.com/?q=" # prompt # "&format=json";
    let response = await OutCall.httpGetRequest(url, [], transform);

    if (response == "") {
      return "I couldn't find anything on that topic, try asking something else? " # "If you are Michael, try a lerp to the left.";
    };
    response;
  };
};
