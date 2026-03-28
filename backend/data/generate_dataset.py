import os
import pandas as pd
import numpy as np

def generate_synthetic_data(num_samples=7000):
    np.random.seed(42)
    
    # 1. Base numericals
    # Income: Lognormal distribution (mostly 40k-120k, some high earners)
    income = np.random.lognormal(mean=11.0, sigma=0.6, size=num_samples)
    income = np.clip(income, 15000, 400000).astype(int)
    
    # Credit Score: Normal distribution centered around 680
    credit_score = np.random.normal(680, 60, size=num_samples)
    credit_score = np.clip(credit_score, 300, 850).astype(int)
    
    # Age: 18 - 75
    age = np.random.randint(18, 75, size=num_samples)
    
    # Loan Amount: usually correlated with income (0.1x to 1.5x of income)
    loan_multiplier = np.random.uniform(0.1, 1.5, size=num_samples)
    loan_amount = (income * loan_multiplier).astype(int)
    
    # 2. Categoricals
    gender = np.random.choice(['Male', 'Female', 'Non-binary'], size=num_samples, p=[0.48, 0.49, 0.03])
    race = np.random.choice(['White', 'Black', 'Hispanic', 'Asian', 'Other'], size=num_samples, p=[0.5, 0.15, 0.15, 0.15, 0.05])
    
    emp_types = ['Full-time', 'Part-time', 'Self-employed', 'Unemployed', 'Gig']
    employment = np.random.choice(emp_types, size=num_samples, p=[0.6, 0.15, 0.1, 0.05, 0.1])
    
    edu_levels = ['High School', 'Some College', 'Bachelors', 'Graduate']
    education = np.random.choice(edu_levels, size=num_samples, p=[0.25, 0.25, 0.35, 0.15])
    
    citizenship = np.random.choice(['Citizen', 'Permanent Resident', 'Visa Holder'], size=num_samples, p=[0.8, 0.15, 0.05])
    language = np.random.choice(['Fluent', 'Basic'], size=num_samples, p=[0.85, 0.15])
    disability = np.random.choice(['No', 'Yes'], size=num_samples, p=[0.9, 0.1])
    criminal = np.random.choice(['No', 'Yes'], size=num_samples, p=[0.92, 0.08])
    
    zip_groups = np.random.choice(
        ['Urban Professional', 'Working Class Urban', 'High-income Suburban', 'Rural', 'Historically Redlined'], 
        size=num_samples
    )
    
    purposes = ['Home', 'Auto', 'Business', 'Education', 'Medical', 'Other']
    purpose = np.random.choice(purposes, size=num_samples, p=[0.3, 0.25, 0.15, 0.1, 0.1, 0.1])
    
    # Age group derivation
    age_group = []
    for a in age:
        if a < 30: age_group.append('Under 30')
        elif a <= 60: age_group.append('30-60')
        else: age_group.append('Over 60')

    # 3. Create Target Variable (Probabilistic to achieve ~75-85% accuracy)
    # Using a logistic setup so it's not perfect but learnable.
    
    # Base intercept
    logits = -1.5 
    
    # Credit score is biggest factor
    logits += (credit_score - 650) * 0.015
    
    # Debt-to-Income Penalty
    dti = loan_amount / income
    logits -= dti * 2.5
    
    # Employment penalties
    logits = np.where(employment == 'Unemployed', logits - 3.0, logits)
    logits = np.where(employment == 'Part-time', logits - 1.0, logits)
    
    # Criminal record penalty
    logits = np.where(criminal == 'Yes', logits - 2.5, logits)
    
    # Slight proxy bias to ensure fairness metrics show gaps (without completely hardcoding)
    logits = np.where((race == 'Black') | (race == 'Hispanic'), logits - 0.5, logits)
    logits = np.where(gender == 'Female', logits - 0.3, logits)
    
    # Loan purpose nuances
    logits = np.where(purpose == 'Business', logits - 0.5, logits) # Business loans are riskier
    
    # Add pure random gaussian noise (This ensures accuracy drops from 99% down to ~75-80%)
    logits += np.random.normal(0, 1.5, size=num_samples)
    
    # Convert logit to probability
    probabilities = 1 / (1 + np.exp(-logits))
    
    # Actual approval based on probability (Coin flip)
    approved = (np.random.rand(num_samples) < probabilities)
    approved_labels = ['Approved' if val else 'Rejected' for val in approved]

    # Create DataFrame
    df = pd.DataFrame({
        'ID': range(1, num_samples + 1),
        'Gender': gender,
        'Race': race,
        'Age': age,
        'Age_Group': age_group,
        'Income': income,
        'Credit_Score': credit_score,
        'Loan_Amount': loan_amount,
        'Employment_Type': employment,
        'Education_Level': education,
        'Citizenship_Status': citizenship,
        'Language_Proficiency': language,
        'Disability_Status': disability,
        'Criminal_Record': criminal,
        'Zip_Code_Group': zip_groups,
        'Loan_Purpose': purpose,
        'Loan_Approved': approved_labels
    })
    
    return df

if __name__ == "__main__":
    df = generate_synthetic_data(7500)
    out_path = os.path.join(os.path.dirname(__file__), 'Financial_Loan_Access_Dataset.csv')
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} rows and saved to {out_path}")
    print("Approval Count:")
    print(df['Loan_Approved'].value_counts(normalize=True))
