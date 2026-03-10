import Map "mo:core/Map";
import Array "mo:core/Array";
import List "mo:core/List";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";

import OutCall "http-outcalls/outcall";



actor {
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
    rank : Rank;
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

  type BanRecord = {
    userId : Text;
    expiresAt : Int; // Unix timestamp in seconds
    reason : Text;
  };

  var nextMessageId = 0;
  var nextUserId = 0;

  let users = Map.empty<Text, User>();
  // Maps username -> current active userId (for rank persistence + duplicate kick)
  let nameToUserId = Map.empty<Text, Text>();
  // Set of userId values that have been superseded by a new login of the same name
  let kickedUserIds = Map.empty<Text, Bool>();
  let publicMessages = List.empty<Message>();
  let directMessages = Map.empty<Text, List.List<Message>>();
  let bans = Map.empty<Text, BanRecord>();

  var accessCode = "1017";
  var splash : Text = "";
  var versionString : Text = "v2.4.1";

  let verificationArray = [
    // Smart move using test array, let's keep this until a fix is out.
    ("MichaelCuUlrichKlein", "1017"),
    ("PascalKlarenberg", "1337"),
  ];

  public func verifyCode(code : Text) : async Bool {
    // Check array codes first
    let arrayMatch = verificationArray.find(
      func(pair) { code == pair.1 }
    );
    if (arrayMatch != null) { return true };

    // Check dynamic access code
    if (code == accessCode) { return true };

    false;
  };

  func generateUserId() : Text {
    nextUserId += 1;
    "user" # nextUserId.toText();
  };

  public shared ({ caller }) func registerUser(name : Text) : async Text {
    let userId = generateUserId();

    // Determine rank: inherit from previous session if name has logged in before
    // Read rank BEFORE removing the old user record
    let inheritedRank : Rank = switch (nameToUserId.get(name)) {
      case (null) { #Friend };
      case (?oldUserId) {
        let rank = switch (users.get(oldUserId)) {
          case (null) { #Friend };
          case (?oldUser) { oldUser.rank };
        };
        // Now kick the old session
        users.remove(oldUserId);
        kickedUserIds.add(oldUserId, true);
        rank;
      };
    };

    let user : User = {
      id = userId;
      name;
      lastSeen = Time.now();
      rank = inheritedRank;
    };
    users.add(userId, user);
    nameToUserId.add(name, userId);
    userId;
  };

  public shared ({ caller }) func forceAdminRank(userId : Text) : async Bool {
    switch (users.get(userId)) {
      case (null) { false };
      case (?user) {
        let updatedUser : User = {
          id = user.id;
          name = user.name;
          lastSeen = user.lastSeen;
          rank = #Admin;
        };
        users.add(userId, updatedUser);
        true;
      };
    };
  };

  public query ({ caller }) func getUserRank(userId : Text) : async Text {
    switch (users.get(userId)) {
      case (null) { "Not found" };
      case (?user) { rankToText(user.rank) };
    };
  };

  func rankToText(rank : Rank) : Text {
    switch (rank) {
      case (#Admin) { "Admin" };
      case (#Employee) { "Employee" };
      case (#Friend) { "Friend" };
      case (#VIP) { "VIP" };
    };
  };

  public query ({ caller }) func getUsers() : async [User] {
    users.values().toArray().sort();
  };

  public shared ({ caller }) func updateLastSeen(userId : Text) : async () {
    switch (users.get(userId)) {
      case (null) { Runtime.trap("User not found!") };
      case (?user) {
        let updatedUser : User = {
          id = user.id;
          name = user.name;
          lastSeen = Time.now();
          rank = user.rank;
        };
        users.add(userId, updatedUser);
      };
    };
  };

  public query ({ caller }) func getSplash() : async Text {
    splash;
  };

  public query ({ caller }) func getVersionString() : async Text {
    versionString;
  };

  public shared ({ caller }) func setVersionString(adminUserId : Text, version : Text) : async Bool {
    switch (users.get(adminUserId)) {
      case (null) { false };
      case (?adminUser) {
        switch (adminUser.rank) {
          case (#Admin) {
            versionString := version;
            true;
          };
          case (_) { false };
        };
      };
    };
  };

  public shared ({ caller }) func setSplash(adminUserId : Text, text : Text) : async Bool {
    switch (users.get(adminUserId)) {
      case (null) { false };
      case (?adminUser) {
        switch (adminUser.rank) {
          case (#Admin) {
            splash := text;
            true;
          };
          case (_) { false };
        };
      };
    };
  };

  public shared ({ caller }) func setAccessCode(adminUserId : Text, code : Text) : async Bool {
    switch (users.get(adminUserId)) {
      case (null) { false };
      case (?adminUser) {
        switch (adminUser.rank) {
          case (#Admin) {
            accessCode := code;
            true;
          };
          case (_) { false };
        };
      };
    };
  };

  public shared ({ caller }) func sendMessage(userId : Text, text : Text, replyToId : ?Nat, replyToText : ?Text) : async Nat {
    checkBanAndThrow(userId);

    let user = switch (users.get(userId)) {
      case (null) { Runtime.trap("User not found!") };
      case (?user) { user };
    };

    let message : Message = {
      id = nextMessageId;
      userId;
      userName = user.name;
      text;
      timestamp = Time.now();
      userRank = rankToText(user.rank);
      replyToId;
      replyToText;
      edited = false;
    };

    nextMessageId += 1;

    if (publicMessages.size() >= 500) {
      ignore publicMessages.removeLast();
    };
    publicMessages.add(message);
    message.id;
  };

  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
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

  public shared ({ caller }) func assignRank(adminUserId : Text, targetUserId : Text, rank : Rank) : async Bool {
    switch (users.get(adminUserId)) {
      case (null) { false };
      case (?adminUser) {
        switch (adminUser.rank) {
          case (#Admin) {
            switch (users.get(targetUserId)) {
              case (null) { false };
              case (?targetUser) {
                let updatedUser : User = {
                  id = targetUser.id;
                  name = targetUser.name;
                  lastSeen = targetUser.lastSeen;
                  rank;
                };
                users.add(targetUserId, updatedUser);
                true;
              };
            };
          };
          case (_) { false };
        };
      };
    };
  };

  public query ({ caller }) func getMessages(since : Int) : async [Message] {
    publicMessages.sort().toArray().filter(
      func(msg) { msg.timestamp > since }
    );
  };

  public shared ({ caller }) func sendDM(fromUserId : Text, toUserId : Text, text : Text) : async Nat {
    let sender = switch (users.get(fromUserId)) {
      case (null) { Runtime.trap("Sender not found!") };
      case (?user) { user };
    };

    let dm : Message = {
      id = nextMessageId;
      userId = toUserId;
      userName = sender.name;
      text;
      timestamp = Time.now();
      userRank = rankToText(sender.rank);
      replyToId = null;
      replyToText = null;
      edited = false;
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

  public query ({ caller }) func getDMs(userId : Text, _otherUserId : Text) : async [Message] {
    switch (directMessages.get(userId)) {
      case (null) { [] };
      case (?messages) { messages.sort().toArray() };
    };
  };

  // NEW Features - Ban System
  func checkBanAndThrow(userId : Text) {
    switch (bans.get(userId)) {
      case (null) { () };
      case (?ban) {
        if (Time.now() < ban.expiresAt) {
          Runtime.trap(
            "User is banned: " # ban.reason # " until " # ban.expiresAt.toText()
          );
        };
      };
    };
  };

  public shared ({ caller }) func banUser(adminUserId : Text, targetUserId : Text, durationMinutes : Nat, reason : Text) : async Bool {
    switch (users.get(adminUserId)) {
      case (null) { false };
      case (?adminUser) {
        switch (adminUser.rank) {
          case (#Admin) {
            let banRecord : BanRecord = {
              userId = targetUserId;
              expiresAt = Time.now() + (durationMinutes.toInt() * 60 * 1_000_000_000);
              reason;
            };
            bans.add(targetUserId, banRecord);
            true;
          };
          case (_) { false };
        };
      };
    };
  };

  public query ({ caller }) func checkBan(userId : Text) : async {
    banned : Bool;
    reason : Text;
    expiresAt : Int;
  } {
    switch (bans.get(userId)) {
      case (null) {
        { banned = false; reason = ""; expiresAt = 0 };
      };
      case (?ban) {
        if (Time.now() < ban.expiresAt) {
          { banned = true; reason = ban.reason; expiresAt = ban.expiresAt };
        } else {
          { banned = false; reason = ""; expiresAt = 0 };
        };
      };
    };
  };

  // EDIT/DELETE Messages (Admin Only)
  public shared ({ caller }) func editMessage(adminUserId : Text, messageId : Nat, newText : Text) : async Bool {
    switch (users.get(adminUserId)) {
      case (null) { false };
      case (?adminUser) {
        switch (adminUser.rank) {
          case (#Admin) {
            var found = false;
            let updatedMessages = publicMessages.map<Message, Message>(
              func(msg) {
                if (msg.id == messageId) {
                  found := true;
                  {
                    msg with
                    text = newText;
                    edited = true;
                  };
                } else {
                  msg;
                };
              }
            );
            publicMessages.clear();
            publicMessages.addAll(updatedMessages.reverseValues());
            found;
          };
          case (_) { false };
        };
      };
    };
  };

  public shared ({ caller }) func deleteMessage(adminUserId : Text, messageId : Nat) : async Bool {
    switch (users.get(adminUserId)) {
      case (null) { false };
      case (?adminUser) {
        switch (adminUser.rank) {
          case (#Admin) {
            let initialSize = publicMessages.size();
            if (initialSize == 0) { return false };

            let filteredMessages = publicMessages.filter(
              func(msg) { msg.id != messageId }
            );

            let filteredSize = filteredMessages.size();
            publicMessages.clear();
            publicMessages.addAll(filteredMessages.reverseValues());

            filteredSize < initialSize;
          };
          case (_) { false };
        };
      };
    };
  };

  // KICK USER - remove from active users; they can rejoin
  public shared ({ caller }) func kickUser(adminUserId : Text, targetUserId : Text) : async Bool {
    switch (users.get(adminUserId)) {
      case (null) { false };
      case (?adminUser) {
        switch (adminUser.rank) {
          case (#Admin) {
            switch (users.get(targetUserId)) {
              case (null) { false };
              case (?targetUser) {
                users.remove(targetUserId);
                kickedUserIds.add(targetUserId, true);
                // Also clear name mapping so rejoin creates fresh session
                nameToUserId.remove(targetUser.name);
                true;
              };
            };
          };
          case (_) { false };
        };
      };
    };
  };

  public query ({ caller }) func isKicked(userId : Text) : async Bool {
    // Kicked if removed from active users OR explicitly in kickedUserIds set
    (not users.containsKey(userId)) or kickedUserIds.containsKey(userId);
  };
};
