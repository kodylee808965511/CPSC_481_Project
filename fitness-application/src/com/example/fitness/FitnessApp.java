package com.example.fitness;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;

public class FitnessApp extends JFrame {
    private final JRadioButton metricBtn = new JRadioButton("Metric (kg, cm)");
    private final JRadioButton imperialBtn = new JRadioButton("Imperial (lb, in)");
    private final JTextField heightField = new JTextField(10);
    private final JTextField weightField = new JTextField(10);
    private final JSpinner ageSpinner = new JSpinner(new SpinnerNumberModel(25, 1, 120, 1));
    private final JComboBox<String> sexCombo = new JComboBox<>(new String[]{"Female", "Male"});
    private final JLabel bmiValue = new JLabel("-");
    private final JLabel bmiCategory = new JLabel("-");
    private final JLabel bfpValue = new JLabel("-");
    private final JLabel bfpCategory = new JLabel("-");

    public FitnessApp() {
        super("Fitness Application");
        setDefaultCloseOperation(WindowConstants.EXIT_ON_CLOSE);
        setLayout(new BorderLayout());

        try { UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName()); } catch (Exception ignored) {}

        JPanel content = new JPanel(new BorderLayout());
        content.setBorder(new EmptyBorder(16, 16, 16, 16));
        content.add(buildFormPanel(), BorderLayout.NORTH);
        content.add(buildResultPanel(), BorderLayout.CENTER);
        content.add(buildButtons(), BorderLayout.SOUTH);
        setContentPane(content);

        pack();
        setMinimumSize(new Dimension(480, getHeight()));
        setLocationRelativeTo(null);
    }

    private JPanel buildFormPanel() {
        JPanel p = new JPanel(new GridBagLayout());
        GridBagConstraints c = new GridBagConstraints();
        c.insets = new Insets(8, 8, 8, 8);
        c.gridx = 0; c.gridy = 0; c.anchor = GridBagConstraints.WEST;

        ButtonGroup unitGroup = new ButtonGroup();
        unitGroup.add(metricBtn);
        unitGroup.add(imperialBtn);
        metricBtn.setSelected(true);

        JPanel unitRow = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 0));
        unitRow.add(new JLabel("Units:"));
        unitRow.add(metricBtn);
        unitRow.add(imperialBtn);
        p.add(unitRow, c);

        c.gridy++;
        p.add(new JLabel("Age:"), c);
        c.gridx = 1; p.add(ageSpinner, c);

        c.gridx = 0; c.gridy++;
        p.add(new JLabel("Sex:"), c);
        c.gridx = 1; p.add(sexCombo, c);

        c.gridx = 0; c.gridy++;
        p.add(new JLabel("Height:"), c);
        c.gridx = 1; p.add(heightField, c);
        c.gridx = 2; p.add(new JLabel("cm / in"), c);

        c.gridx = 0; c.gridy++;
        p.add(new JLabel("Weight:"), c);
        c.gridx = 1; p.add(weightField, c);
        c.gridx = 2; p.add(new JLabel("kg / lb"), c);

        return p;
    }

    private JPanel buildResultPanel() {
        JPanel p = new JPanel(new GridBagLayout());
        p.setBorder(BorderFactory.createTitledBorder("Results"));
        GridBagConstraints c = new GridBagConstraints();
        c.insets = new Insets(6, 8, 6, 8);
        c.gridx = 0; c.gridy = 0; c.anchor = GridBagConstraints.WEST;

        p.add(new JLabel("BMI:"), c);
        c.gridx = 1; p.add(bmiValue, c);
        c.gridx = 2; p.add(new JLabel("Category:"), c);
        c.gridx = 3; p.add(bmiCategory, c);

        c.gridx = 0; c.gridy++;
        p.add(new JLabel("BFP (%):"), c);
        c.gridx = 1; p.add(bfpValue, c);
        c.gridx = 2; p.add(new JLabel("Category:"), c);
        c.gridx = 3; p.add(bfpCategory, c);

        return p;
    }

    private JPanel buildButtons() {
        JPanel p = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        JButton calc = new JButton("Calculate");
        JButton reset = new JButton("Reset");
        p.add(reset);
        p.add(calc);

        calc.addActionListener(e -> onCalculate());
        reset.addActionListener(e -> onReset());
        return p;
    }

    private void onReset() {
        metricBtn.setSelected(true);
        ageSpinner.setValue(25);
        sexCombo.setSelectedIndex(0);
        heightField.setText("");
        weightField.setText("");
        bmiValue.setText("-");
        bmiCategory.setText("-");
        bfpValue.setText("-");
        bfpCategory.setText("-");
    }

    private void onCalculate() {
        boolean metric = metricBtn.isSelected();
        int age = (Integer) ageSpinner.getValue();
        boolean isMale = sexCombo.getSelectedIndex() == 1;

        Double height = parsePositive(heightField.getText());
        Double weight = parsePositive(weightField.getText());

        if (height == null || weight == null) {
            JOptionPane.showMessageDialog(this, "Please enter valid numeric height and weight.", "Validation", JOptionPane.WARNING_MESSAGE);
            return;
        }
        if (age <= 0) {
            JOptionPane.showMessageDialog(this, "Age must be positive.", "Validation", JOptionPane.WARNING_MESSAGE);
            return;
        }

        double heightCm = Calculators.toCm(height, metric);
        double weightKg = Calculators.toKg(weight, metric);

        try {
            double bmi = Calculators.bmi(weightKg, heightCm);
            String bmiCat = Calculators.bmiCategory(bmi);
            double bfp = Calculators.bfpDeurenberg(bmi, age, isMale);
            String bfpCat = Calculators.bfpCategory(isMale, bfp);

            bmiValue.setText(Calculators.fmt1(bmi));
            bmiCategory.setText(bmiCat);
            bfpValue.setText(Calculators.fmt1(bfp));
            bfpCategory.setText(bfpCat);
        } catch (IllegalArgumentException ex) {
            JOptionPane.showMessageDialog(this, ex.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
        }
    }

    private static Double parsePositive(String s) {
        try {
            double v = Double.parseDouble(s.trim());
            return v > 0 ? v : null;
        } catch (Exception e) {
            return null;
        }
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> new FitnessApp().setVisible(true));
    }
}

