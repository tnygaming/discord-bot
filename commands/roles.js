const Enmap = require("enmap");

const { MessageEmbed } = require("discord.js");

const PERMISSION_FLAGS = require("discord.js").Permissions.FLAGS;
const ALFRED_ROLE = 'TNY';
const BLACKLISTED_ROLES = [
  "Admin",
  "Moderator"
];

function buildHelpEmbed() {
  return new MessageEmbed()
      .setTitle('Roles')
      .setDescription('Roles command options')
      .addFields(
          { name: '.roles create [role] {category}',
            value: 'Create a new role optional category (Mod only)'},
          { name: '.roles enroll [role] [@user...]',
            value: 'Enroll user(s) to a role (Mod only)'},
          { name: '.roles join [role]',
            value: 'Join a role'},
          { name: '.roles leave [role]',
            value: 'Leave a role'},
          { name: '.roles list',
            value: 'Displays all available roles'},
          { name: '.roles remove [role]',
            value: 'Remove a role (Mod only)'},
          { name: '.roles set [role] [@user]',
            value: 'Sets owner of role to @user (Admin only)'},
      )
      .setTimestamp()
      .setFooter("BOT Alfred");
}

function sendHelp(channel) {
  return channel.send({embed: buildHelpEmbed() });
}

// This is okay for now but prob want to move this later to another
// file like util and change from boolean to accepting bitmask
function checkPermissions(message, isMod, isAdmin) {
  return (isMod && message.member.hasPermission(PERMISSION_FLAGS.MANAGE_MESSAGES)) ||
      (isAdmin && message.member.hasPermission(PERMISSION_FLAGS.ADMINISTRATOR))
}

function validateRoleOwner(client, message, roleName) {
  const roleData = client.rolesData.ensure(message.guild.id, {});
  return checkPermissions(message, false, true) || (roleData[roleName] && roleData[roleName] === message.member.id);
}

function getAllowedRoles(client, guildId) {
  return client.rolesData.ensure(guildId, {});
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

// I went for a pun-ish function name. t0shi
function enroleUsers(client, message, roleName, memberRole) {
  if (message.mentions.members.size < 1) {
    return message.channel.send("Please specify a user with a @mention.");
  }
  let users = message.mentions.members.map(user => user.displayName).join(", ");
  message.mentions.members.mapValues(member => member.roles.add(memberRole));
  return message.channel.send(`${users} has been added to ${roleName} role`);
}

function updateRoleOwner(client, message, roleName) {
  let roleData = client.rolesData.ensure(message.guild.id, {});
  if (message.mentions.members.size !== 1) {
    return message.channel.send("Please specify new owner with a @mention.");
  }
  let newOwner = message.mentions.members.firstKey();
  let username = message.mentions.members.first().displayName;
  roleData[roleName] = newOwner;
  client.rolesData.set(message.guild.id, roleData);
  return message.channel.send(`${roleName} role has a new owner of ${username}`);
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
        let category = message.guild.channels.cache.find(channelToFind => channelToFind.name === 'roles');
        if (args[2] !== undefined) {
          category = message.guild.channels.cache.find(channelToFind => channelToFind.name.toLowerCase() === args[2].toLowerCase());
        }

        let roleData = {
          name: role,
          hoist: false,
          mentionable: true
        }
        registerNewRole(client, message.guild.id, message.member.id, role);
        await server.roles.create({ data: roleData,
          reason: 'dynamic role' });
        await server.channels.create(role, { reason: 'dynamic role based channel',
          parent: category,
          permissionOverwrites: [
            {
              id: message.guild.roles.everyone,
              deny: [
                PERMISSION_FLAGS.VIEW_CHANNEL,
                PERMISSION_FLAGS.SEND_MESSAGES,
                PERMISSION_FLAGS.READ_MESSAGE_HISTORY
              ]
            },
            {
              id: message.guild.roles.cache.find(roleToFind => roleToFind.name === role),
              allow: [
                PERMISSION_FLAGS.VIEW_CHANNEL,
                PERMISSION_FLAGS.SEND_MESSAGES,
                PERMISSION_FLAGS.READ_MESSAGE_HISTORY
              ]
            },
            {
              id: message.guild.roles.cache.find(roleToFind => roleToFind.name === ALFRED_ROLE),
              allow: [
                  PERMISSION_FLAGS.VIEW_CHANNEL,
                  PERMISSION_FLAGS.SEND_MESSAGES,
                  PERMISSION_FLAGS.READ_MESSAGE_HISTORY,
                  PERMISSION_FLAGS.MANAGE_CHANNELS
              ]
            }
          ]});
        channel.send("Role and channel created.");
      }
      break;
    }
    case "enroll": {
      if (!checkPermissions(message, true, true)) {
        channel.send("Sorry, you must be Moderator or higher to create a role.");
        break;
      }
      if (!role || !allowedRoles[role]) {
        // invalid rank, send allowed ranks
        return sendInvalidRole(client, channel);
      }
      if (!memberRole || !allowedRoles[role] || BLACKLISTED_ROLES.includes(role)) {
        channel.send("Invalid role name. Please choose a different name.");
      } else {
        enroleUsers(client, message, role, memberRole);
      }
      break;
    }
    case "join": {
      if (!role || !allowedRoles[role]) {
        // invalid rank, send allowed ranks
        return sendInvalidRole(client, channel);
      }
      // TODO: Add check that this role does not have any abuse-able permissions
      if (memberRole) {
        await message.member.roles.add(memberRole);
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
        await message.member.roles.remove(memberRole);
        channel.send(`${author.username} has been removed from role: ${role}`);
      } else {
        console.log("No role found");
      }

      break;
    }
    case "list": {
      return channel.send(`${"Available roles:\n • "}${Object.keys(allowedRoles).sort()
          .join("\n • ")}`, {code: "asciidoc"});
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
        let channelToRemove = server.channels.cache.find(channelToFind => channelToFind.name === role);
        let channelMessage = '';
        if (channelToRemove !== undefined) {
          await channelToRemove.delete();
          channelMessage = "and channel "
        }
        await memberRole.delete();
        channel.send(`Role ${channelMessage}removed.`);
      }
      break;
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
