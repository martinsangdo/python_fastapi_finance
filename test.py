import random
import string
import time

def generate_user_id():
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return f"user{suffix}"

# Generate 500 unique high-risk user IDs
high_risk_users = list({generate_user_id() for _ in range(600)})[:500]

# Generate 100k batch transactions
all_user_pool = high_risk_users + [generate_user_id() for _ in range(10_000)]

batch_data = [
    {
        'transaction_id': i,
        'user_id': random.choice(all_user_pool),
        'amount': round(random.uniform(10, 10_000), 2)
    }
    for i in range(1, 100_001)
]

def process_batch_transactions(batch_data, high_risk_users):
    flagged_transactions = []
    high_risk_set = set(high_risk_users)

    for transaction in batch_data:
        if transaction["user_id"] in high_risk_set:
            transaction['flagged'] = True
            flagged_transactions.append(transaction)
    return flagged_transactions


if __name__ == "__main__":
    high_risk_users += ['user456', 'user789']

    start = time.perf_counter()
    print(f"[START]  {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"[INFO]   Processing {len(batch_data):,} transactions against {len(high_risk_users):,} high-risk users...")

    flagged = process_batch_transactions(batch_data, high_risk_users)
    print(f"[RESULT] Flagged {len(flagged):,} / {len(batch_data):,} transactions ({len(flagged)/len(batch_data)*100:.2f}%)")
    end = time.perf_counter()
    print(f"[END]    {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"[TIME]   {end - start:.6f}s elapsed")
