from ace import ACELiteLLM
import os

# Check for API keys
if not os.getenv("OPENAI_API_KEY") and not os.getenv("ANTHROPIC_API_KEY") and not os.getenv("GOOGLE_API_KEY"):
    print("⚠️  Warning: No API keys found. Please set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_API_KEY.")

# Create agent that learns automatically
# Using gpt-4o-mini as default, but ace-framework supports others
try:
    agent = ACELiteLLM(model="gpt-4o-mini")

    print("\n--- Interaction 1 ---")
    answer1 = agent.ask("What is 2+2?")
    print(f"Answer: {answer1}")

    print("\n--- Interaction 2 ---")
    answer2 = agent.ask("What is the capital of France?")
    print(f"Answer: {answer2}")

    # Agent now has learned strategies!
    print(f"\n✅ Learned {len(agent.skillbook.skills())} strategies")

    # Save for later
    agent.save_skillbook("my_agent.json")
    print("💾 Skillbook saved to my_agent.json")

except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\nTip: Make sure you have set your LLM API keys in the environment.")
