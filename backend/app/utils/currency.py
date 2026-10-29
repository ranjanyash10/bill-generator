"""Utility module for currency operations in Indian Rupees (INR).
"""

def number_to_words_inr(amount: float) -> str:
    """Converts a monetary amount into words formatted in the Indian numbering system
    (Crores, Lakhs, Thousands, Hundreds, Paise).
    
    Examples:
        112100.00 -> 'One Lakh Twelve Thousand One Hundred Rupees Only'
        112100.50 -> 'One Lakh Twelve Thousand One Hundred Rupees and Fifty Paise Only'
        1.00      -> 'One Rupee Only'
        0.50      -> 'Fifty Paise Only'
        0.00      -> 'Zero Rupees Only'
    """
    if amount is None:
        return "Zero Rupees Only"
    try:
        amount = float(amount)
    except (ValueError, TypeError):
        return "Zero Rupees Only"

    if amount < 0:
        prefix = "Minus "
        amount = abs(amount)
    else:
        prefix = ""

    rupees = int(amount)
    paise = int(round((amount - rupees) * 100))
    if paise == 100:
        rupees += 1
        paise = 0

    if rupees == 0 and paise == 0:
        return "Zero Rupees Only"

    units = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen"
    ]
    tens = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    ]

    def two_digits(n: int) -> str:
        if n == 0:
            return ""
        if n < 20:
            return units[n]
        rem = n % 10
        return (tens[n // 10] + (" " + units[rem] if rem > 0 else "")).strip()

    def three_digits(n: int) -> str:
        h = n // 100
        rem = n % 100
        parts = []
        if h > 0:
            parts.append(units[h] + " Hundred")
        if rem > 0:
            parts.append(two_digits(rem))
        return " ".join(parts).strip()

    words_parts = []
    crores = rupees // 10000000
    rem_cr = rupees % 10000000
    lakhs = rem_cr // 100000
    rem_lakh = rem_cr % 100000
    thousands = rem_lakh // 1000
    rem_th = rem_lakh % 1000

    if crores > 0:
        if crores >= 100:
            words_parts.append(three_digits(crores) + " Crore")
        else:
            words_parts.append(two_digits(crores) + " Crore")
    if lakhs > 0:
        words_parts.append(two_digits(lakhs) + " Lakh")
    if thousands > 0:
        words_parts.append(two_digits(thousands) + " Thousand")
    if rem_th > 0:
        words_parts.append(three_digits(rem_th))

    rupee_str = " ".join(words_parts).strip()
    result = prefix
    if rupee_str:
        result += f"{rupee_str} Rupee{'s' if rupees != 1 else ''}"
        if paise > 0:
            result += f" and {two_digits(paise)} Paise"
    else:
        if paise > 0:
            result += f"{two_digits(paise)} Paise"

    result += " Only"
    return result
