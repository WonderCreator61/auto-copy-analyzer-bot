import { TelegramClient } from "telegram";
import dotenv from "dotenv";
import { StringSession } from "telegram/sessions/index.js";
import readline from "readline";
import { TG_API_ID, TG_API_HASH, TG_CHANNEL } from "../utils/constants";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

dotenv.config();

const apiId = Number(TG_API_ID); // Telegram API ID
const apiHash = TG_API_HASH; // Telegram API Hash
const stringSession = new StringSession(process.env.TG_SESSION); // Telegram StringSession
const channel = TG_CHANNEL; // Telegram channel username or ID

let telegramClient: TelegramClient | null = null;

async function startTelegramClient() {
  if (!apiId || !apiHash) return;
  if (!telegramClient) {
    telegramClient = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });
    await telegramClient.start({
      phoneNumber: async () =>
        new Promise((resolve) =>
          rl.question("Please enter your number: ", resolve)
        ),
      password: async () =>
        new Promise((resolve) =>
          rl.question("Please enter your password: ", resolve)
        ),
      phoneCode: async () =>
        new Promise((resolve) =>
          rl.question("Please enter the code you received: ", resolve)
        ),
      onError: (err) => console.log(err),
    });

    // console.log("Telegram client started", telegramClient.session.save());
  }
}

async function findAndClickButton(
  message: any,
  buttonText: any,
  caseSensitive = false
) {
  if (!message.replyMarkup || !message.replyMarkup.rows.length) {
    return false;
  }

  for (
    let rowIndex = 0;
    rowIndex < message.replyMarkup.rows.length;
    rowIndex++
  ) {
    const row = message.replyMarkup.rows[rowIndex];
    for (let buttonIndex = 0; buttonIndex < row.buttons.length; buttonIndex++) {
      const btn = row.buttons[buttonIndex];
      const btnText = caseSensitive ? btn.text : btn.text.toLowerCase();
      const searchText = caseSensitive ? buttonText : buttonText.toLowerCase();

      if (btnText.includes(searchText)) {
        await message.click({ i: rowIndex, j: buttonIndex });
        return true;
      }
    }
  }
  return false;
}

async function handleProtectionButton(
  message: any,
  buttonText: any,
  desiredStatus: any
) {
  if (!message.replyMarkup || !message.replyMarkup.rows.length) {
    return false;
  }

  for (
    let rowIndex = 0;
    rowIndex < message.replyMarkup.rows.length;
    rowIndex++
  ) {
    const row = message.replyMarkup.rows[rowIndex];
    for (let buttonIndex = 0; buttonIndex < row.buttons.length; buttonIndex++) {
      const btn = row.buttons[buttonIndex];
      const btnText = btn.text.toLowerCase();
      const searchText = buttonText.toLowerCase();

      if (btnText.includes(searchText)) {
        // Check button color to determine current status
        const isGreen = btn.text.includes("🟢");
        const isRed = btn.text.includes("🔴");

        const currentStatus = isGreen ? true : isRed ? false : "unknown";

        // Only click if the current status doesn't match desired status
        if (currentStatus !== desiredStatus) {
          await message.click({ i: rowIndex, j: buttonIndex });
          return true;
        }
        return false; // No click needed, status already matches
      }
    }
  }
  return false;
}

async function addNewCopyHandler(req: any, res: any) {
  const target_wallet = req.body.target_wallet;
  if (!target_wallet) {
    return res
      .status(400)
      .json({ success: false, error: "target_wallet is required" });
  }

  // Fixed duration for all Telegram interactions
  const TELEGRAM_DELAY = 2000; // 100ms

  // Extract payload values from request body
  const payloadValues = {
    maxBuyCount: req.body.maxBuyCount,
    maxBuy: req.body.maxBuy,
    minTriggerBuy: req.body.minTriggerBuy,
    maxTriggerBuy: req.body.maxTriggerBuy,
    minMCap: req.body.minMCap,
    maxMCap: req.body.maxMCap,
    minTokenAge: req.body.minTokenAge,
    maxTokenAge: req.body.maxTokenAge,
    buyAmount: req.body.buyAmount,
    buyFee: req.body.buyFee,
    sellFee: req.body.sellFee,
    buySlippage: req.body.buySlippage,
    sellSlippage: req.body.sellSlippage,
    buyTip: req.body.buyTip,
    sellTip: req.body.sellTip,
    isOnlyBondingCurve: req.body.isOnlyBondingCurve,
    limitOrders: req.body.limitOrders,
    buyProtection: req.body.buyProtection,
    sellProtection: req.body.sellProtection,
  };

  try {
    if (!telegramClient) {
      return res
        .status(500)
        .json({ success: false, error: "Telegram client not initialized." });
    }

    const messages = await telegramClient.getMessages(channel, { limit: 1 });
    let lastMsgId = messages.length ? messages[0].id : 0;
    await telegramClient.sendMessage(channel, { message: "/copy" });
    let startReply = null;
    for (let i = 0; i < 10; i++) {
      const newMessages = await telegramClient.getMessages(channel, {
        limit: 1,
      });
      if (
        newMessages.length &&
        newMessages[0].id > lastMsgId &&
        newMessages[0].message !== "/copy"
      ) {
        startReply = newMessages[0];
        break;
      }
      await new Promise((res) => setTimeout(res, TELEGRAM_DELAY));
    }
    if (!startReply) {
      return res
        .status(500)
        .json({
          success: false,
          error: "No reply message found after sending '/copy'.",
        });
    }
    // @ts-ignore
    if (!startReply.replyMarkup || !startReply.replyMarkup.rows.length) {
      return res
        .status(500)
        .json({
          success: false,
          error: "No buttons found on the reply to '/copy'.",
        });
    }

    const copyTradeClicked = await findAndClickButton(
      startReply,
      "Add new config"
    );
    if (!copyTradeClicked) {
      return res
        .status(500)
        .json({
          success: false,
          error: "Button named 'Add new config' not found.",
        });
    }

    await telegramClient.sendMessage(channel, { message: target_wallet });
    await new Promise((res) => setTimeout(res, TELEGRAM_DELAY));
    await telegramClient.sendMessage(channel, { message: target_wallet });
    await new Promise((res) => setTimeout(res, TELEGRAM_DELAY));

    // Click Buy Fixed button
    const latestMessagesForBuyFixed = await telegramClient.getMessages(
      channel,
      { limit: 1 }
    );
    const latestMsgForBuyFixed = latestMessagesForBuyFixed[0];

    if (latestMsgForBuyFixed) {
      await findAndClickButton(latestMsgForBuyFixed, "Buy Fixed");
      await new Promise((res) => setTimeout(res, TELEGRAM_DELAY));
    }

    // Handle Protection buttons
    if (
      payloadValues.buyProtection !== undefined ||
      payloadValues.sellProtection !== undefined
    ) {
      const latestMessagesForProtection = await telegramClient.getMessages(
        channel,
        { limit: 1 }
      );
      const latestMsgForProtection = latestMessagesForProtection[0];

      if (latestMsgForProtection) {
        // Handle Buy Protection
        if (payloadValues.buyProtection !== undefined) {
          await handleProtectionButton(
            latestMsgForProtection,
            "Buy Protection",
            payloadValues.buyProtection
          );
          await new Promise((res) => setTimeout(res, TELEGRAM_DELAY));
        }

        // Handle Sell Protection
        if (payloadValues.sellProtection !== undefined) {
          await handleProtectionButton(
            latestMsgForProtection,
            "Sell Protection",
            payloadValues.sellProtection
          );
          await new Promise((res) => setTimeout(res, TELEGRAM_DELAY));
        }
      }
    }

    // Process each payload value in order
    const payloadOrder = [
      { key: "maxBuyCount", label: "Max Buy Count" },
      { key: "maxBuy", label: "Max Buy" },
      { key: "minTriggerBuy", label: "Min Trigger Buy" },
      { key: "maxTriggerBuy", label: "Max Trigger Buy" },
      { key: "minMCap", label: "Min MCap" },
      { key: "maxMCap", label: "Max MCap" },
      { key: "minTokenAge", label: "Min Token Age" },
      { key: "maxTokenAge", label: "Max Token Age" },
      { key: "buyAmount", label: "Buy Amount" },
      { key: "buyFee", label: "Buy Fee" },
      { key: "sellFee", label: "Sell Fee" },
      { key: "buySlippage", label: "Buy Slippage" },
      { key: "sellSlippage", label: "Sell Slippage" },
      { key: "buyTip", label: "Buy Tip" },
      { key: "sellTip", label: "Sell Tip" },
    ];

    for (const payload of payloadOrder) {
      // @ts-ignore
      const value = payloadValues[payload.key];
      if (value !== undefined && value !== null) {
        // Get the latest message to find the button
        const latestMessages = await telegramClient.getMessages(channel, {
          limit: 1,
        });
        const latestMsg = latestMessages[0];

        if (latestMsg) {
          // Click the button for this payload
          const buttonClicked = await findAndClickButton(
            latestMsg,
            payload.label
          );
          if (buttonClicked) {
            // Send the payload value
            await telegramClient.sendMessage(channel, {
              message: value.toString(),
            });
            await new Promise((res) => setTimeout(res, TELEGRAM_DELAY)); // Small delay between actions
          }
        }
      }
    }

    // Platform selection before final step
    const platforms = [
      "Pump Fun",
      "Moonit",
      "Daos Fun",
      "LaunchLab",
      "Meteora Bonding Curve",
      "Boop Dot Fun",
    ];

    // Click Platforms button
    const latestMessagesForPlatforms = await telegramClient.getMessages(
      channel,
      { limit: 1 }
    );
    const latestMsgForPlatforms = latestMessagesForPlatforms[0];

    if (latestMsgForPlatforms) {
      const platformsButtonClicked = await findAndClickButton(
        latestMsgForPlatforms,
        "Platforms"
      );
      if (platformsButtonClicked) {
        await new Promise((res) => setTimeout(res, TELEGRAM_DELAY));

        // Check isOnlyBondingCurve value
        const isOnlyBondingCurve = payloadValues.isOnlyBondingCurve;

        if (isOnlyBondingCurve === true) {
          // Click Deselect All first
          const messagesAfterPlatforms = await telegramClient.getMessages(
            channel,
            { limit: 1 }
          );
          const msgAfterPlatforms = messagesAfterPlatforms[0];

          if (msgAfterPlatforms) {
            const deselectAllClicked = await findAndClickButton(
              msgAfterPlatforms,
              "Deselect All"
            );
            if (deselectAllClicked) {
              await new Promise((res) => setTimeout(res, TELEGRAM_DELAY));

              // Click each platform in order
              for (const platform of platforms) {
                const platformMessages = await telegramClient.getMessages(
                  channel,
                  { limit: 1 }
                );
                const platformMsg = platformMessages[0];

                if (platformMsg) {
                  await findAndClickButton(platformMsg, platform);
                  await new Promise((res) => setTimeout(res, TELEGRAM_DELAY));
                }
              }
            }
          }
        } else {
          // Click Select All
          const messagesAfterPlatforms = await telegramClient.getMessages(
            channel,
            { limit: 1 }
          );
          const msgAfterPlatforms = messagesAfterPlatforms[0];

          if (msgAfterPlatforms) {
            await findAndClickButton(msgAfterPlatforms, "Select All");
            await new Promise((res) => setTimeout(res, TELEGRAM_DELAY));
          }
        }

        // Click Back button
        const messagesAfterPlatformSelection = await telegramClient.getMessages(
          channel,
          { limit: 1 }
        );
        const msgAfterPlatformSelection = messagesAfterPlatformSelection[0];

        if (msgAfterPlatformSelection) {
          await findAndClickButton(msgAfterPlatformSelection, "Back");
          await new Promise((res) => setTimeout(res, TELEGRAM_DELAY));
        }
      }
    }

    // Limit Orders processing before final step
    if (
      payloadValues.limitOrders &&
      Array.isArray(payloadValues.limitOrders) &&
      payloadValues.limitOrders.length > 0
    ) {
      // Click Limit Orders button
      const latestMessagesForLimitOrders = await telegramClient.getMessages(
        channel,
        { limit: 1 }
      );
      const latestMsgForLimitOrders = latestMessagesForLimitOrders[0];

      if (latestMsgForLimitOrders) {
        const limitOrdersButtonClicked = await findAndClickButton(
          latestMsgForLimitOrders,
          "Limit Orders"
        );
        if (limitOrdersButtonClicked) {
          await new Promise((res) => setTimeout(res, TELEGRAM_DELAY));

          // Iterate through each limit order
          for (const limitOrder of payloadValues.limitOrders) {
            // Click Create Limit Order
            const messagesAfterLimitOrders = await telegramClient.getMessages(
              channel,
              { limit: 1 }
            );
            const msgAfterLimitOrders = messagesAfterLimitOrders[0];

            if (msgAfterLimitOrders) {
              const createLimitOrderClicked = await findAndClickButton(
                msgAfterLimitOrders,
                "Create Limit Order"
              );
              if (createLimitOrderClicked) {
                await new Promise((res) => setTimeout(res, TELEGRAM_DELAY));

                // Click Sell at: and input sellAt value
                const messagesAfterCreate = await telegramClient.getMessages(
                  channel,
                  { limit: 1 }
                );
                const msgAfterCreate = messagesAfterCreate[0];

                if (msgAfterCreate) {
                  const sellAtClicked = await findAndClickButton(
                    msgAfterCreate,
                    "Sell at:"
                  );
                  if (sellAtClicked) {
                    await telegramClient.sendMessage(channel, {
                      message: limitOrder.sellAt.toString(),
                    });
                    await new Promise((res) => setTimeout(res, TELEGRAM_DELAY));

                    // Click Sell Amount: and input sellAmount value
                    const messagesAfterSellAt =
                      await telegramClient.getMessages(channel, { limit: 1 });
                    const msgAfterSellAt = messagesAfterSellAt[0];

                    if (msgAfterSellAt) {
                      const sellAmountClicked = await findAndClickButton(
                        msgAfterSellAt,
                        "Sell Amount:"
                      );
                      if (sellAmountClicked) {
                        await telegramClient.sendMessage(channel, {
                          message: limitOrder.sellAmount.toString(),
                        });
                        await new Promise((res) =>
                          setTimeout(res, TELEGRAM_DELAY)
                        );

                        // Click Create Order
                        const messagesAfterSellAmount =
                          await telegramClient.getMessages(channel, {
                            limit: 1,
                          });
                        const msgAfterSellAmount = messagesAfterSellAmount[0];

                        if (msgAfterSellAmount) {
                          await findAndClickButton(
                            msgAfterSellAmount,
                            "Create Order"
                          );
                          await new Promise((res) =>
                            setTimeout(res, TELEGRAM_DELAY)
                          );
                        }
                      }
                    }
                  }
                }
              }
            }
          }

          // Click Back after all limit orders are created
          const messagesAfterAllLimitOrders = await telegramClient.getMessages(
            channel,
            { limit: 1 }
          );
          const msgAfterAllLimitOrders = messagesAfterAllLimitOrders[0];

          if (msgAfterAllLimitOrders) {
            await findAndClickButton(msgAfterAllLimitOrders, "Back");
            await new Promise((res) => setTimeout(res, TELEGRAM_DELAY));
          }
        }
      }
    }

    // Final step: click the active button
    const latestMessages = await telegramClient.getMessages(channel, {
      limit: 1,
    });
    const latestMsg = latestMessages[0];

    if (latestMsg) {
      await findAndClickButton(latestMsg, "active");
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export { startTelegramClient, addNewCopyHandler };
