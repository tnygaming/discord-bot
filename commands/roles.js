const Enmap = require("enmap");

// permissions maybe use flag const from lib later?
const MANAGE_MESSAGES = 'MANAGE_MESSAGES';
const ADMINISTRATOR = 'ADMINISTRATOR';

const BLACKLISTED_ROLES = [
  "Admin",
  "Moderator",
  "tnydotatoes"
];

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

// This is okay for now but prob want to move this later to another
// file like util and change from boolean to accepting bitmask
function checkPermissions(message, isMod, isAdmin) {
  return (isMod && message.member.hasPermission(MANAGE_MESSAGES)) || (isAdmin && message.member.hasPermission(ADMINISTRATOR))
}

function validateRoleOwner(client, message, roleName) {
  const roleData = client.rolesData.ensure(message.guild.id, {});
  return checkPermissions(message, false, true) || (roleData[roleName] && roleData[roleName] == message.member.id);
}

function getAllowedRoles(client, guildId) {
  let roleData = client.rolesData.ensure(guildId, {});
  // TEMP CONVERSION CODE START
  if (Array.isArray(roleData)) {
    let newRoleData = {};
    // this is ivan id XD
    roleData.forEach(role => newRoleData[role] = '143144196016963584');
    client.rolesData.set(guildId, newRoleData);
    roleData = newRoleData
  }
  return roleData;
}

function sendInvalidRole(client, channel) {
  let allowedRoles = getAllowedRoles(client, channel.guild.id);
  return channel.send(`${"Invalid role, available role:\n • "}${Object.keys(allowedRoles).sort()
.join("\n • ")}`, {code: "asciidoc"});
}

function registerNewRole(client, guildId, ownerId, newRoleName) {
  let roleData = client.rolesData.ensure(guildId, {});
  roleData[newRoleName] = ownerId;
  client.rolesData.set(guildId, roleData);
}

function deregisterRole(client, guildId, roleName) {
  let roleData = client.rolesData.ensure(guildId, {});
  if (roleData[roleName]) {
    delete roleData[roleName];
    client.rolesData.set(guildId, roleData);
  }
}

function updateRoleOwner(client, message, roleName) {
  let roleData = client.rolesData.ensure(message.guild.id, {});
  if (message.mentions.members.length != 1) {
    return message.channel.send("Please specify new owner with a @mention.");
  }
  let newOwner = message.mentions.members.firstKey;
  roleData[roleName] = newOwner;
  client.rolesData.set(message.guild.id, roleData);
  return message.channel.send(`${roleName} role has a new owner of ${newOwner}`);
}

//
// * Migration for existing roles **
// .eval client.rolesData.set('143146071814569986', [
// "tarkov",
// "tnydotatoes",
// "theboiis"]);
//

exports.run = async (client, message, args, _level) => {
  client.rolesData = new Enmap({name: "rolesData"});
  const channel = message.channel;
  console.log("DEBUG ME");
  const subcommand = args[0];
  const role = args[1];
  const author = message.author;
  const server = client.guilds.cache.get(message.guild.id);
  const allowedRoles = getAllowedRoles(client, message.guild.id);
  const memberRole = server.roles.cache.find(roleToFind => roleToFind.name === role);

  if (!subcommand) {
    return sendHelp(channel);
  }

  switch (subcommand) {
    case "join": {
      if (!role || !allowedRoles.includes(role)) {
        // invalid rank, send allowed ranks
        return sendInvalidRole(client, channel);
      }
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
      if (!role || !allowedRoles[role]) {
        // invalid rank, send allowed ranks
        return sendInvalidRole(client, channel);
      }
        if (memberRole) {
          message.member.roles.remove(memberRole);
          channel.send(`${author.username} has been removed from role: ${role}`);
        } else {
          console.log("No role found");
        }

      break;
    }
    case "create": {
      if (!checkPermissions(message, true, true)) {
        channel.send("Sorry, you must be Moderator or higher to create a role.");
        break;
      }
      // discord has max of 250 roles per guild, leaving buffer
      if (allowedRoles.length > 100) {
        channel.send("Yikes, we have too many roles right now.");
        break;
      }
      if (memberRole || BLACKLISTED_ROLES.includes(role)) {
        channel.send("Invalid role name, please choose a different name");
      } else {
        // TODO: This currently adds the lowest permission set possible, but can we add even less?
        let roleData = {
          name: role,
          hoist: false,
          mentionable: true
        }
        registerNewRole(client, message.guild.id, message.member.id, role);
        server.roles.create({ data: roleData,
reason: 'dynamic role' });
        server.channels.create(role, { reason: 'dynamic role based channel' });
        channel.send("Role and channel created.");
      }
      break;
    }
    case "remove": {
      if (!checkPermissions(message, true, true)) {
        channel.send("Sorry, you must be Moderator or higher to create a role.");
        break;
      }
      if (!memberRole || !allowedRoles[role] || BLACKLISTED_ROLES.includes(role)) {
        channel.send("Invalid role name, please choose a different name");
      } else if (!validateRoleOwner(client, message, role)) {
        channel.send("You must be the role owner or admin to delete role.");
      } else {
        deregisterRole(client, message.guild.id, role);
        server.channels.cache.find(channelToFind => channelToFind.name === role).delete();
        memberRole.delete();
        channel.send("Role removed.");
      }
      break;
    }
    case "list": {
      return channel.send(`${"Available roles:\n • "}${Object.keys(allowedRoles).sort()
.join("\n • ")}`, {code: "asciidoc"});
    }
    case "set": {
      if (!checkPermissions(message, false, true)) {
        channel.send("Sorry, you must be an Admin to change role ownership.");
        break;
      }
      if (!memberRole || !allowedRoles[role] || BLACKLISTED_ROLES.includes(role)) {
        channel.send("Invalid role name. Please choose a different name.");
      } else {
        updateRoleOwner(client, message, role);
      }
      break;
    }
    default:
      return sendHelp(channel);
  }
};

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
