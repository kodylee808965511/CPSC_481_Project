package com.example.fitness;

import java.util.Locale;

public final class Calculators {
    private Calculators() {}

    public static double bmi(double weightKg, double heightCm) {
        if (weightKg <= 0 || heightCm <= 0) throw new IllegalArgumentException("Invalid inputs");
        double h = heightCm / 100.0;
        return weightKg / (h * h);
    }

    public static double bfpDeurenberg(double bmi, int age, boolean isMale) {
        if (bmi <= 0 || age <= 0) throw new IllegalArgumentException("Invalid inputs");
        double sex = isMale ? 1.0 : 0.0;
        return 1.20 * bmi + 0.23 * age - 10.8 * sex - 5.4;
    }

    public static String bmiCategory(double bmi) {
        if (bmi < 18.5) return "Underweight";
        if (bmi < 25.0) return "Normal";
        if (bmi < 30.0) return "Overweight";
        return "Obese";
    }

    public static String bfpCategory(boolean isMale, double bfp) {
        if (isMale) {
            if (bfp < 2) return "Below essential";
            if (bfp <= 5) return "Essential";
            if (bfp <= 13) return "Athletes";
            if (bfp <= 17) return "Fitness";
            if (bfp <= 24) return "Average";
            return "Obese";
        } else {
            if (bfp < 10) return "Below essential";
            if (bfp <= 13) return "Essential";
            if (bfp <= 20) return "Athletes";
            if (bfp <= 24) return "Fitness";
            if (bfp <= 31) return "Average";
            return "Obese";
        }
    }

    public static double toKg(double weight, boolean metric) {
        return metric ? weight : weight * 0.45359237;
    }

    public static double toCm(double height, boolean metric) {
        return metric ? height : height * 2.54;
    }

    public static String fmt1(double v) {
        return String.format(Locale.US, "%.1f", v);
    }
}

