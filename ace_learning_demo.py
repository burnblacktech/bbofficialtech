from ace import ACELiteLLM
import os

# Generic interactive learning demo
def run_learning_demo():
    print("🧠 ACE Framework: Self-Learning Demo")
    
    # Initialize agent
    agent = ACELiteLLM(model="gpt-4o-mini")
    
    # Optional: Load existing skills
    if os.path.exists("tax_expert.json"):
        agent.load_skillbook("tax_expert.json")

    # Round 1: Initial Ask
    print("\n--- Step 1: Initial Interaction ---")
    question1 = "What should I know about ITR-4?"
    print(f"User: {question1}")
    response1 = agent.ask(question1)
    print(f"Agent: {response1}")

    # Round 2: Provide Feedback (The "Learning" moment)
    print("\n--- Step 2: Providing Feedback ---")
    feedback = "Ensure you explicitly mention Section 44AD (Business) and 44ADA (Profession) as key presumptive sections."
    print(f"User Feedback: {feedback}")
    
    # Trigger learning
    success = agent.learn_from_feedback(feedback)
    if success:
        skills = agent.skillbook.skills()
        print(f"✅ Agent learned! Skills now: {len(skills)}")
        for skill in skills:
            # Skill objects in ACE often have a name or description attribute
            name = getattr(skill, 'name', str(skill))
            print(f" - Learned: {name}")
    else:
        print("❌ Learning failed or no new strategy extracted.")

    # Round 3: Verification
    print("\n--- Step 3: Testing the Learned Strategy ---")
    question2 = "Briefly summarize ITR-4 for a freelancer."
    print(f"User: {question2}")
    # The agent should now automatically apply the strategy it learned
    response2 = agent.ask(question2)
    print(f"Agent: {response2}")

    # Save the skillbook
    agent.save_skillbook("tax_expert.json")
    print("\n💾 Skillbook saved to tax_expert.json")

if __name__ == "__main__":
    if not os.getenv("OPENAI_API_KEY") and not os.getenv("ANTHROPIC_API_KEY"):
        print("⚠️  Please set OPENAI_API_KEY or ANTHROPIC_API_KEY first.")
    else:
        run_learning_demo()
