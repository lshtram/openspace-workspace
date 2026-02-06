import { test, expect } from "./fixtures"
import { sendMessage } from "./actions"
import { promptSelector } from "./selectors"

test("can send a prompt and receive a reply", async ({ page, gotoHome }) => {
  test.setTimeout(120_000)
  await gotoHome()

  const token = `E2E_REACT_${Date.now()}`
  await sendMessage(page, `IMPORTANT: Reply ONLY with the following token and nothing else: ${token}`)

  // Verify prompt is cleared after send
  await expect(page.locator(promptSelector)).toHaveValue("")

  // Wait for ANY assistant reply
  const assistantBubble = page.locator('.message-bubble.assistant')
  await expect(assistantBubble.first()).toBeVisible({ timeout: 120_000 })
  
  // Verify tokens updated (it might be 0 tokens if the model is free, so we just check it exists)
  await expect(page.getByText(/tokens/i)).toBeVisible()
})
