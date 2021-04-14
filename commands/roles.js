const Enmap = require("enmap");

const BLACKLISTED_ROLES = [
  "Admin",
  "Moderator",
  "tnydotatoes"
];

// 
// * Migration for existing roles **
// .eval client.rolesData.set('143146071814569986', [
// "tarkov",
// "tnydotatoes",
// "theboiis"]);
// 

exports.run = async (client, message, args, level) => {
  client.rolesData = new Enmap({name: "rolesData"});
  const channel = message.channel;

  const subcommand = args[0];
  const author = message.author;
  const server = client.guilds.cache.get(message.guild.id);

  if (!subcommand) {
    return sendHelp(channel);
  }

  switch (subcommand) {
    case "join": {
      const role = args[1];
      let allowedRoles = getAllowedRoles(client, message.guild.id);
      if (!role || !allowedRoles.includes(role)) {
        // invalid rank, send allowed ranks
        return sendInvalidRole(client, channel);
      }
        const memberRole = server.roles.cache.find(roleToFind => roleToFind.name === args[1]);
        // TODO: Add check that this role does not have any abuse-able permissions
        if (memberRole) {
          message.member.roles.add(memberRole);
          channel.send(`${author.username} has been added to role: ${role}`);
        } else {
          console.log("No role found");
        }
      
      break;
    }
    case "leave": {
      const role = args[1];
      let allowedRoles = getAllowedRoles(client, message.guild.id);
      if (!role || !allowedRoles.includes(role)) {
        // invalid rank, send allowed ranks
        return sendInvalidRole(client, channel);
      }
        const memberRole = server.roles.cache.find(roleToFind => roleToFind.name === args[1]);
        if (memberRole) {
          message.member.roles.remove(memberRole);
          channel.send(`${author.username} has been removed from role: ${role}`);
        } else {
          console.log("No role found");
        }
      
      break;
    }
    case "create": {
      // TODO: Replace this with an actual permission check 
      // since roles may not be consistent across guilds
      let doesUserHaveAccess = message.member.roles.cache.some(roleToFind => roleToFind.name === 'Moderator' || roleToFind.name === 'Admin');
      if (!doesUserHaveAccess) {
        channel.send("Sorry, you must be Moderator or higher to create a role.");
        break;
      }
      let allowedRoles = getAllowedRoles(client, message.guild.id);
      // discord has max of 250 roles per guild, leaving buffer
      if (allowedRoles.length > 100) {
        channel.send("Yikes, we have too many roles right now.");
        break;
      }
      const role = args[1];
      const memberRole = server.roles.cache.find(roleToFind => roleToFind.name === args[1]);
      if (memberRole || BLACKLISTED_ROLES.includes(role)) {
        channel.send("Invalid role name, please choose a different name");
      } else {
        // TODO: This currently adds the lowest permission set possible, but can we add even less?
        let roleData = {
          name: args[1],
          hoist: false,
          mentionable: true
        }
        registerNewRole(client, message.guild.id, args[1]);
        // TODO: Does this note do anything?
        server.roles.create({ data: roleData,
reason: 'dynamic role' });
        channel.send("Role created.");
      }
      break;
    }
    case "remove": {
      // TODO: Replace this with an actual permission check 
      // since roles may not be consistent across guilds
      let doesUserHaveAccess = message.member.roles.cache.some(roleToFind => roleToFind.name === 'Moderator' || roleToFind.name === 'Admin');
      if (!doesUserHaveAccess) {
        channel.send("Sorry, you must be Moderator or higher to create a role.");
        break;
      }
      let allowedRoles = getAllowedRoles(client, message.guild.id);
      const role = args[1];
      const memberRole = server.roles.cache.find(roleToFind => roleToFind.name === args[1]);
      if (!memberRole || !allowedRoles.includes(role) || BLACKLISTED_ROLES.includes(role)) {
        channel.send("Invalid role name, please choose a different name");
      } else {
        deregisterRole(client, message.guild.id, args[1]);
        memberRole.delete();
        channel.send("Role removed.");
      }
      break;
    }
    case "list": {
      let allowedRoles = getAllowedRoles(client, channel.guild.id);
      return channel.send(`${"Available roles:\n • "}${allowedRoles.join("\n • ")}`, {code: "asciidoc"});
    }
    default:
      return sendHelp(channel);
  }
};

function sendHelp(channel) {
  return channel.send(
`= USAGE =
.roles create [role]   :: Create a new role (Mod only)
.roles remove [role]   :: Remove a role (Mod only)
.roles join [role]     :: Join a role
.roles leave [role]    :: Leave a role
.roles list            :: Displays all available roles`,
  {code: "asciidoc"}
);
}

function sendInvalidRole(client, channel) {
  let allowedRoles = getAllowedRoles(client, channel.guild.id);
  return channel.send(`${"Invalid role, available role:\n • "}${allowedRoles.join("\n • ")}`, {code: "asciidoc"});
}

function getAllowedRoles(client, guildId) {
  const roleData = client.rolesData.ensure(guildId, []);
  return roleData;
}

function registerNewRole(client, guildId, newRoleName) {
  // TODO: Add sorting
  const roleData = client.rolesData.ensure(guildId, []);
  roleData.push(newRoleName);
  client.rolesData.set(guildId, roleData);
}

function deregisterRole(client, guildId, roleName) {
  const roleData = client.rolesData.ensure(guildId, []);
  const index = roleData.indexOf(roleName);
  if (index >= 0) {
    roleData.splice(index, 1);
    client.rolesData.set(guildId, roleData);
  }
}

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: ["role"],
  permLevel: "User"
};

exports.help = {
  name: "roles",
  category: "Miscellaneous",
  description: "Create or join a role",
  usage: "roles join [@role]"
};
