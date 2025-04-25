import React, { useState } from "react";
import {
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Button,
  Alert,
  Snackbar,
  Typography,
} from "@mui/material";
import "./BodyFatCalculator.css";

const measurementUnits = [
  { value: "inches", label: "Inches" },
  { value: "cm", label: "Centimeters" },
];

export default function BodyFatCalculator() {
  const [gender, setGender] = useState("male");
  const [waist, setWaist] = useState("");
  const [waistUnit, setWaistUnit] = useState("inches");
  const [neck, setNeck] = useState("");
  const [neckUnit, setNeckUnit] = useState("inches");
  const [hip, setHip] = useState("");
  const [hipUnit, setHipUnit] = useState("inches");
  const [height, setHeight] = useState("");
  const [heightUnit, setHeightUnit] = useState("inches");
  const [bodyFat, setBodyFat] = useState(null);
  const [alertMsg, setAlertMsg] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  const resetForm = () => {
    setGender("male");
    setWaist("");
    setWaistUnit("inches");
    setNeck("");
    setNeckUnit("inches");
    setHip("");
    setHipUnit("inches");
    setHeight("");
    setHeightUnit("inches");
    setBodyFat(null);
    setAlertMsg("");
    setShowAlert(false);
  };

  const convertToInches = (value, unit) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return null;
    return unit === "cm" ? num / 2.54 : num;
  };

  const isInValidRange = (valueInInches) => {
    return valueInInches >= 10 && valueInInches <= 150;
  };

  const validateFields = () => {
    const waistIn = convertToInches(waist, waistUnit);
    const neckIn = convertToInches(neck, neckUnit);
    const heightIn = convertToInches(height, heightUnit);
    const hipIn = gender === "female" ? convertToInches(hip, hipUnit) : 0;

    if (
      waistIn === null ||
      neckIn === null ||
      heightIn === null ||
      (gender === "female" && hipIn === null)
    ) {
      showError("Please enter valid numeric values.");
      return false;
    }

    if (
      !isInValidRange(waistIn) ||
      !isInValidRange(neckIn) ||
      !isInValidRange(heightIn) ||
      (gender === "female" && !isInValidRange(hipIn))
    ) {
      showError("Values must be between 10 and 150 inches.");
      return false;
    }

    if (waistIn <= neckIn) {
      showError("Waist must be larger than neck.");
      return false;
    }

    if (gender === "female" && waistIn + hipIn <= neckIn) {
      showError("Sum of waist and hip must be greater than neck.");
      return false;
    }

    return true;
  };

  const showError = (msg) => {
    setAlertMsg(msg);
    setShowAlert(true);
    setBodyFat(null);
  };

  const calculateBodyFat = () => {
    if (!validateFields()) return;

    const waistIn = convertToInches(waist, waistUnit);
    const neckIn = convertToInches(neck, neckUnit);
    const heightIn = convertToInches(height, heightUnit);
    const hipIn = gender === "female" ? convertToInches(hip, hipUnit) : 0;

    let bfPercent = 0;
    if (gender === "male") {
      bfPercent =
        86.010 * Math.log10(waistIn - neckIn) -
        70.041 * Math.log10(heightIn) +
        36.76;
    } else {
      bfPercent =
        163.205 * Math.log10(waistIn + hipIn - neckIn) -
        97.684 * Math.log10(heightIn) -
        78.387;
    }

    setBodyFat(bfPercent.toFixed(2));
    setAlertMsg("");
    setShowAlert(false);
  };

  return (
    <div className="calculator-container">
      <Typography variant="h4" gutterBottom>
        US Navy Body Fat Calculator
      </Typography>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          calculateBodyFat();
        }}
      >
        <FormControl fullWidth margin="normal">
          <InputLabel>Gender</InputLabel>
          <Select
            value={gender}
            label="Gender"
            onChange={(e) => setGender(e.target.value)}
          >
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
          </Select>
        </FormControl>

        <InputWithUnit
          label="Waist"
          value={waist}
          setValue={setWaist}
          unit={waistUnit}
          setUnit={setWaistUnit}
        />

        <InputWithUnit
          label="Neck"
          value={neck}
          setValue={setNeck}
          unit={neckUnit}
          setUnit={setNeckUnit}
        />

        {gender === "female" && (
          <InputWithUnit
            label="Hip"
            value={hip}
            setValue={setHip}
            unit={hipUnit}
            setUnit={setHipUnit}
          />
        )}

        <InputWithUnit
          label="Height"
          value={height}
          setValue={setHeight}
          unit={heightUnit}
          setUnit={setHeightUnit}
        />

        <div className="button-group">
          <Button type="submit" variant="contained" color="primary">
            Calculate
          </Button>
          <Button variant="outlined" color="secondary" onClick={resetForm}>
            Reset
          </Button>
        </div>

        {bodyFat && (
          <div className="result">
            <Typography variant="h6" gutterBottom>
              Estimated Body Fat: {bodyFat}%
            </Typography>
            <Typography variant="body2">
              {gender === "male"
                ? "Ideal: 10–20% for healthy adult males."
                : "Ideal: 18–28% for healthy adult females."}
            </Typography>
          </div>
        )}
      </form>

      <Snackbar
        open={showAlert}
        autoHideDuration={5000}
        onClose={() => setShowAlert(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setShowAlert(false)}>
          {alertMsg}
        </Alert>
      </Snackbar>

      <Typography className="footer" mt={4}>
        Uses the <strong>U.S. Navy Body Fat Formula</strong>
      </Typography>
    </div>
  );
}

function InputWithUnit({ label, value, setValue, unit, setUnit }) {
  return (
    <div className="input-unit-row">
      <TextField
        fullWidth
        label={`${label} Value`}
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        margin="normal"
        inputProps={{ min: 0, step: "any" }}
      />
      <FormControl fullWidth margin="normal">
        <InputLabel>Unit</InputLabel>
        <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
          {measurementUnits.map((u) => (
            <MenuItem key={u.value} value={u.value}>
              {u.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}
