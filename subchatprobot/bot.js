require('dotenv').config();
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');

// ======================
// 1. CONFIGURATION
// ======================
console.log('⏳ Loading configuration...');
const {
  MONGO_URI,
  TELEGRAM_BOT_TOKEN,
  CHECK_INTERVAL_MINUTES = 60
} = process.env;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('🚨 CRITICAL ERROR: TELEGRAM_BOT_TOKEN is not defined in environment variables');
  process.exit(1);
}

console.log('✅ Configuration loaded');

// ======================
// 2. DATABASE MODELS
// ======================
console.log('⏳ Initializing database models...');
const Group = mongoose.model('Group', new mongoose.Schema({
  telegramGroupId: { type: String, required: true, unique: true },
  groupName: String,
  lastChecked: Date
}));

const Subscription = mongoose.model('Subscription', new mongoose.Schema({
  telegramUsername: { type: String, required: true, index: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  status: { type: String, enum: ['active', 'expired'], default: 'active' },
  expiresAt: { type: Date, required: true }
}));
console.log('✅ Database models initialized');

// ======================
// 3. BOT INITIALIZATION
// ======================
console.log('⏳ Initializing bot...');
const bot = new Telegraf(TELEGRAM_BOT_TOKEN, {
  telegram: { webhookReply: false }
});

// Store bot info globally
let botInfo;
bot.telegram.getMe().then(info => {
  botInfo = info;
  console.log(`🤖 Bot initialized: @${info.username} (ID: ${info.id})`);
}).catch(err => {
  console.error('🚨 Failed to get bot info:', err);
});

// ======================
// 4. CORE FUNCTIONS
// ======================

/**
 * Validates bot's admin permissions in a group
 */
async function validateBotPermissions(chatId) {
  console.log(`🔍 Checking permissions for group ${chatId}`);
  try {
    const botMember = await bot.telegram.getChatMember(chatId, botInfo.id);
    const hasPermission = botMember.can_restrict_members;
    console.log(`📊 Permission check for ${chatId}: ${hasPermission ? '✅ Has permissions' : '❌ No permissions'}`);
    return hasPermission;
  } catch (err) {
    console.error(`🚨 Permission check failed for ${chatId}:`, err.message);
    return false;
  }
}

/**
 * Checks if bot can send messages in a group
 */
async function canBotSendMessages(chatId) {
  console.log(`🔍 Checking send permissions for group ${chatId}`);
  try {
    const chat = await bot.telegram.getChat(chatId);
    if (chat.permissions) {
      return chat.permissions.can_send_messages;
    }
    const botMember = await bot.telegram.getChatMember(chatId, botInfo.id);
    return botMember.can_send_messages;
  } catch (err) {
    console.error(`🚨 Send permission check failed for ${chatId}:`, err.message);
    return false;
  }
}

/**
 * Checks if user has active subscription
 */
async function hasActiveSubscription(username, groupId) {
  if (!username) {
    console.log('ℹ️ No username provided for subscription check');
    return false;
  }
  
  console.log(`🔍 Checking subscription for @${username} in group ${groupId}`);
  const sub = await Subscription.findOne({
    telegramUsername: username.toLowerCase(),
    groupId,
    status: 'active',
    expiresAt: { $gt: new Date() }
  });
  
  const hasSub = !!sub;
  console.log(`📊 Subscription status for @${username}: ${hasSub ? '✅ Active' : '❌ Inactive'}`);
  return hasSub;
}

/**
 * Removes non-subscribed user with rate limiting
 */
async function removeNonSubscriber(chatId, userId, username) {
  console.log(`⚠️ Attempting to remove @${username || userId} from ${chatId}`);
  try {
    await bot.telegram.kickChatMember(chatId, userId);
    console.log(`✅ Removed user @${username || userId} from ${chatId}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
  } catch (err) {
    console.error(`🚨 Failed to remove user ${userId}:`, err.message);
  }
}

/**
 * Get user subscription status
 */
async function getUserSubscriptionStatus(username, groupId) {
  const sub = await Subscription.findOne({
    telegramUsername: username.toLowerCase(),
    groupId
  }).populate('groupId');

  if (!sub) return null;

  return {
    groupName: sub.groupId.groupName || 'Unknown Group',
    status: sub.status === 'active' && sub.expiresAt > new Date() ? 'ACTIVE ✅' : 'INACTIVE ❌',
    expiresAt: sub.status === 'active' ? sub.expiresAt.toDateString() : 'N/A',
    groupId: sub.groupId.telegramGroupId
  };
}

/**
 * Handles sending group ID when bot is added to new group
 */
async function handleNewGroupAddition(ctx) {
  const chatId = ctx.chat.id;
  const chatTitle = ctx.chat.title || 'Unnamed Group';
  const inviterId = ctx.from.id;
  const inviterUsername = ctx.from.username || 'no-username';

  console.log('🎯 Handling new group addition:', {
    groupId: chatId,
    groupTitle: chatTitle,
    addedAs: ctx.myChatMember.new_chat_member.status,
    inviter: `${inviterUsername} (${inviterId})`
  });

  // Message templates (unchanged)
  const privateMessage = `🎉 Thanks for adding me to "${chatTitle}"!\n\n` +
    `🔑 *GROUP ID:* \`${chatId}\`\n\n` +
    `To activate this group:\n` +
    `1. Register at https://subchatpro.com\n` +
    `2. Use this ID to complete setup\n\n` +
    `Need help? Contact @SubchatproSupport`;

  const groupMessage = `👋 Hello admins!\n\n` +
    `To activate this group:\n` +
    `1. Register at https://subchatpro.com\n` +
    `2. Use this GROUP ID: \`${chatId}\`\n\n` +
    `Need help? Contact @SubchatproSupport`;

  try {
    // 1. Try private message first
    console.log(`📨 Attempting private message to inviter ${inviterId}`);
    await bot.telegram.sendMessage(inviterId, privateMessage, { parse_mode: 'Markdown' });
    console.log('✅ Private message sent');
  } catch (privateError) {
    console.error('🚨 Private message failed:', privateError.message);

    // 2. Fallback to group message if possible
    try {
      const canSend = await checkSendPermissions(chatId);
      if (canSend) {
        console.log('⏳ Attempting group message...');
        await ctx.reply(groupMessage, { parse_mode: 'Markdown' });
        console.log('✅ Group message sent');
      } else {
        console.error('‼️ Cannot send messages in this group');
      }
    } catch (groupError) {
      console.error('🚨 Group message failed:', groupError.message);
    }
  }

  // Skipping database update for isActive field
  console.log('✅ No changes to group status in database');
}


// Helper function to check send permissions
async function checkSendPermissions(chatId) {
  try {
    const chat = await bot.telegram.getChat(chatId);
    if (chat.permissions?.can_send_messages) return true;
    
    const botMember = await bot.telegram.getChatMember(chatId, botInfo.id);
    return botMember.can_send_messages || false;
  } catch (err) {
    console.error('Permission check error:', err);
    return false;
  }
}


// ======================
// 5. COMMAND HANDLERS
// ======================

// Start command
bot.command('start', (ctx) => {
  console.log(`🆕 Start command from ${ctx.from.id} (@${ctx.from.username || 'no-username'})`);
  ctx.replyWithMarkdown(`
👋 *Welcome to SubchatPro Bot!*  

To get started:
1. Add me to your group
2. I'll provide your Group ID
3. Register at [SubchatPro.com](https://subchatpro.com)

*Need help?* Contact @SubchatproSupport
  `);
});

// Check command
bot.command('check', async (ctx) => {
  const username = ctx.message.text.split(' ')[1]?.replace('@', '');
  console.log(`🔍 Check command for @${username} in ${ctx.chat.id}`);
  
  if (!username) {
    console.log('ℹ️ No username specified in check command');
    return ctx.reply('Please specify a username (e.g., /check @username)');
  }

  try {
    const group = await Group.findOne({ telegramGroupId: ctx.chat.id });
    if (!group) {
      console.log(`ℹ️ Group ${ctx.chat.id} not found in database`);
      return ctx.reply('This group is not registered in our system');
    }

    const status = await getUserSubscriptionStatus(username, group._id);
    
    if (!status) {
      console.log(`ℹ️ No subscription found for @${username}`);
      return ctx.replyWithMarkdown(`
📊 *Subscription Check*  
• User: @${username}  
• Status: *NOT FOUND* ❌  
• Group: ${group.groupName || 'Unknown'}  
      `);
    }

    console.log(`📊 Subscription found for @${username}: ${status.status}`);
    ctx.replyWithMarkdown(`
📊 *Subscription Check*  
• Group: *${status.groupName}*  
• User: @${username}  
• Status: *${status.status}*  
• Expires: ${status.expiresAt}  
• Group ID: \`${status.groupId}\`
    `);
  } catch (err) {
    console.error('🚨 Check command failed:', err);
    ctx.reply('An error occurred while checking subscription');
  }
});

// Force command
bot.command('force', async (ctx) => {
  console.log(`⚡ Force command in ${ctx.chat.id}`);
  if (ctx.chat.type === 'private') {
    console.log('ℹ️ Force command used in private chat');
    return ctx.reply('This command only works in groups!');
  }

  try {
    await periodicSubscriptionCheck(ctx.chat.id);
    ctx.reply('✅ Subscription enforcement completed!');
  } catch (err) {
    console.error('🚨 Force command failed:', err);
    ctx.reply('Failed to complete subscription check');
  }
});

// ID command
bot.command('id', (ctx) => {
  if (ctx.chat.type === 'private') {
    console.log('ℹ️ ID command used in private chat');
    return ctx.reply('This command only works in groups!');
  }

  console.log(`🔍 ID command in group ${ctx.chat.id}`);
  ctx.replyWithMarkdown(
    `🔑 *GROUP ID:* \`${ctx.chat.id}\`\n\n` +
    `Use this ID to register at [SubchatPro.com](https://subchatpro.com)`
  );
});

// ======================
// 6. EVENT HANDLERS
// ======================

// New chat members handler (remove non-subscribed)
bot.on('new_chat_members', async (ctx) => {
  console.log('\n=== NEW_CHAT_MEMBERS EVENT TRIGGERED ===');
  console.log('Event details:', {
    chatId: ctx.chat.id,
    chatTitle: ctx.chat.title,
    newMembers: ctx.message.new_chat_members.map(m => ({
      id: m.id,
      username: m.username,
      isBot: m.is_bot
    }))
  });

  const chatId = ctx.chat.id;
  const newMembers = ctx.message.new_chat_members;
  
  const hasPermission = await validateBotPermissions(chatId);
  if (!hasPermission) {
    console.log('⏩ Skipping member check - no permissions');
    return;
  }

  const group = await Group.findOne({ telegramGroupId: chatId });
  if (!group) {
    console.log('⏩ Skipping member check - group not registered');
    return;
  }

  for (const member of newMembers) {
    const username = member.username;
    console.log(`\nProcessing new member:`, {
      userId: member.id,
      username: username,
      isBot: member.is_bot
    });

    // Skip if the new member is a bot
    if (member.is_bot) {
      console.log('⏩ Skipping bot member');
      continue;
    }

    const isSubscribed = await hasActiveSubscription(username, group._id);
    
    if (!isSubscribed) {
      console.log('⚠️ Member has no active subscription - removing');
      await removeNonSubscriber(chatId, member.id, username);
    } else {
      console.log('✅ Member has active subscription - allowing');
    }
  }
});

// Primary handler for bot being added to groups
bot.on('my_chat_member', async (ctx) => {
  console.log('\n=== MY_CHAT_MEMBER EVENT TRIGGERED ===');
  const { old_chat_member, new_chat_member } = ctx.myChatMember;
  
  console.log('Status change:', {
    from: ctx.from.username || ctx.from.id,
    chat: ctx.chat.title || ctx.chat.id,
    oldStatus: old_chat_member.status,
    newStatus: new_chat_member.status
  });

  // Only handle our bot's status changes
  if (new_chat_member.user.id !== botInfo.id) {
    console.log('⏩ Not our bot - skipping');
    return;
  }

  // Detect both cases: added as member OR added directly as admin
  if ((old_chat_member.status === 'left' || old_chat_member.status === 'kicked') &&
      (new_chat_member.status === 'member' || new_chat_member.status === 'administrator')) {
    console.log('🎉 Bot was added to group (as ' + new_chat_member.status + ')');
    await handleNewGroupAddition(ctx);
  }
});

// ======================
// 7. PERIODIC CHECK FUNCTION
// ======================
async function periodicSubscriptionCheck(chatId = null) {
  console.log('\n=== STARTING PERIODIC SUBSCRIPTION CHECK ===');
  
  const filter = {}; // No need to check if group is active, simply fetch all groups or just one
  if (chatId) filter.telegramGroupId = chatId;

  const groups = await Group.find(filter);
  console.log(`🔍 Found ${groups.length} groups to check`);
  
  for (const group of groups) {
    console.log(`\nChecking group: ${group.groupName || 'Unnamed'} (${group.telegramGroupId})`);
    
    // Skip permission check if it's not needed
    if (!await validateBotPermissions(group.telegramGroupId)) {
      console.log('⏩ Skipping group - no permissions');
      continue;
    }
    
    try {
      console.log('⏳ Fetching group members...');
      const members = await bot.telegram.getChatAdministrators(group.telegramGroupId);
      console.log(`📊 Found ${members.length} members in group`);
      
      for (const member of members) {
        if (member.status !== 'member') {
          console.log(`⏩ Skipping ${member.user.username || member.user.id} - not a regular member`);
          continue;
        }
        
        const username = member.user.username;
        const isSubscribed = await hasActiveSubscription(username, group._id);
        
        if (!isSubscribed) {
          console.log(`⚠️ Removing non-subscribed member: @${username || member.user.id}`);
          await removeNonSubscriber(group.telegramGroupId, member.user.id, username);
        }
      }
      
      group.lastChecked = new Date();
      await group.save();
      console.log('✅ Group check completed successfully');
    } catch (err) {
      console.error(`🚨 Error checking group ${group.telegramGroupId}:`, err);
    }
  }
  console.log('=== PERIODIC CHECK COMPLETED ===\n');
}


bot.on('message', async (ctx) => {
  if (ctx.chat.type !== 'supergroup' && ctx.chat.type !== 'group') return;

  const chatId = ctx.chat.id;
  const userId = ctx.from.id;
  const username = ctx.from.username;

  if (!username) {
    console.log(`⏩ Skipping user ${userId} - no username`);
    return;
  }

  const group = await Group.findOne({ telegramGroupId: chatId });
  if (!group) {
    console.log(`⏩ Group ${chatId} not registered`);
    return;
  }

  const isSubscribed = await hasActiveSubscription(username, group._id);
  if (!isSubscribed) {
    console.log(`❌ Message from unsubscribed user @${username} - removing`);
    await removeNonSubscriber(chatId, userId, username);
  } else {
    console.log(`✅ Message from subscribed user @${username}`);
  }
});





// ======================
// 8. STARTUP
// ======================
async function startBot() {
  console.log('\n=== STARTING BOT ===');
  
  try {
    if (MONGO_URI) {
      console.log('⏳ Connecting to database...');
      await mongoose.connect(MONGO_URI, {
        connectTimeoutMS: 5000,
        socketTimeoutMS: 30000
      });
      console.log('✅ Database connected');
    }

    console.log('⏳ Launching bot...');
    await bot.telegram.deleteWebhook(); // <<< Add this line
    await bot.launch();
    
    console.log('🤖 Bot started and running');

    // Start periodic checks
    const intervalMinutes = parseInt(CHECK_INTERVAL_MINUTES);
    setInterval(
      periodicSubscriptionCheck, 
      intervalMinutes * 60 * 1000
    );
    console.log(`🔄 Periodic checks enabled (every ${intervalMinutes} minutes)`);

    // Initial check
    await periodicSubscriptionCheck();
  } catch (err) {
    console.error('🚨 Startup failed:', err);
    process.exit(1);
  }
}






// Graceful shutdown
process.once('SIGINT', () => {
  console.log('\n🛑 Stopping bot (SIGINT)...');
  bot.stop('SIGINT');
  mongoose.disconnect().then(() => process.exit(0));
});

process.once('SIGTERM', () => {
  console.log('\n🛑 Stopping bot (SIGTERM)...');
  bot.stop('SIGTERM');
  mongoose.disconnect().then(() => process.exit(0));
});

// Start the bot
startBot();