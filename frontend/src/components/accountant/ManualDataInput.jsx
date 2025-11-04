import React, { useState } from "react";
import { Calculator, Save, X, Plus, Trash2 } from "lucide-react";
import { CURRENCIES, getCurrencySymbol } from "../../services/currencies";
import { useCurrency } from "../../contexts/CurrencyContext";

const ManualDataInput = ({ onSaveData }) => {
  const { selectedCurrency } = useCurrency();

  const [formData, setFormData] = useState({
    transactionType: "expense",
    date: new Date().toISOString().split("T")[0],
    amount: "",
    description: "",
    category: "",
    paymentMethod: "cash",
    reference: "",
    taxDeductible: false,
    notes: "",
    currency: selectedCurrency,
  });

  // Sinkronkan currency form dengan perubahan global selectedCurrency
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      currency: selectedCurrency,
    }));
  }, [selectedCurrency]);

  const [lineItems, setLineItems] = useState([
    { description: "", amount: "", category: "" },
  ]);

  const [errors, setErrors] = useState({});

  const transactionTypes = [
    { value: "expense", label: "Expense" },
    { value: "income", label: "Income" },
    { value: "transfer", label: "Transfer" },
    { value: "asset", label: "Asset Purchase" },
    { value: "liability", label: "Liability" },
    { value: "equity", label: "Equity" },
  ];

  const categories = {
    expense: [
      "Advertising",
      "Bank Fees",
      "Consulting",
      "Depreciation",
      "Insurance",
      "Interest",
      "Legal",
      "Office Supplies",
      "Rent",
      "Repairs",
      "Salaries",
      "Taxes",
      "Travel",
      "Utilities",
      "Other",
    ],
    income: [
      "Sales",
      "Services",
      "Interest Income",
      "Dividends",
      "Royalties",
      "Rental Income",
      "Other Income",
    ],
    transfer: [
      "Bank Transfer",
      "Credit Card Payment",
      "Owner Investment",
      "Owner Withdrawal",
    ],
    asset: [
      "Equipment",
      "Furniture",
      "Vehicles",
      "Buildings",
      "Land",
      "Investments",
    ],
    liability: [
      "Loans",
      "Credit Cards",
      "Accounts Payable",
      "Notes Payable",
      "Taxes Payable",
    ],
    equity: [
      "Owner Investment",
      "Owner Withdrawal",
      "Retained Earnings",
      "Common Stock",
    ],
  };

  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "check", label: "Check" },
    { value: "credit", label: "Credit Card" },
    { value: "debit", label: "Debit Card" },
    { value: "transfer", label: "Bank Transfer" },
    { value: "paypal", label: "PayPal" },
    { value: "other", label: "Other" },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    // Clear error when field is updated
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  const handleLineItemChange = (index, field, value) => {
    const updatedItems = [...lineItems];
    updatedItems[index][field] = value;
    setLineItems(updatedItems);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", amount: "", category: "" }]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length > 1) {
      const updatedItems = lineItems.filter((_, i) => i !== index);
      setLineItems(updatedItems);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.amount && lineItems.every((item) => !item.amount)) {
      newErrors.amount = "At least one amount is required";
    }
    if (!formData.description && lineItems.every((item) => !item.description)) {
      newErrors.description = "Description is required";
    }

    // Validate line items if they have partial data
    lineItems.forEach((item, index) => {
      if (item.amount && !item.description) {
        newErrors[`lineItem_${index}_description`] = "Description is required";
      }
      if (item.description && !item.amount) {
        newErrors[`lineItem_${index}_amount`] = "Amount is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      // Calculate total from line items if they exist
      const lineItemsTotal = lineItems
        .filter((item) => item.description && item.amount)
        .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

      // Use either the main amount or the sum of line items
      const finalAmount = Math.abs(
        lineItemsTotal > 0 ? lineItemsTotal : parseFloat(formData.amount)
      );

      // Prepare data for saving
      const dataToSave = {
        ...formData,
        amount: finalAmount,
        lineItems: lineItems.filter((item) => item.description && item.amount),
        timestamp: new Date().toISOString(),
      };

      // Call the parent component's save function
      const success = await onSaveData(dataToSave);

      if (success) {
        // Reset form after successful submission (preserve currency)
        setFormData({
          transactionType: "expense",
          date: new Date().toISOString().split("T")[0],
          amount: "",
          description: "",
          category: "",
          paymentMethod: "cash",
          reference: "",
          taxDeductible: false,
          notes: "",
          currency: formData.currency, // Preserve current currency selection
        });

        setLineItems([{ description: "", amount: "", category: "" }]);
        setErrors({});
      }
    }
  };

  return (
    <div className="bg-gray-900 border border-blue-900/30 rounded-lg p-6 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Calculator className="mr-2 h-5 w-5 text-blue-400" />
          Manual Transaction Entry
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Transaction Type and Currency */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Transaction Type
            </label>
            <select
              name="transactionType"
              value={formData.transactionType}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {transactionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>



          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={`w-full bg-gray-800 border ${
                errors.date ? "border-red-500" : "border-gray-700"
              } rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-500">{errors.date}</p>
            )}
          </div>
        </div>

        {/* Main Amount and Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Amount{" "}
              {lineItems.some((item) => item.amount) &&
                "(Optional if using line items)"}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                {getCurrencySymbol(formData.currency)}
              </span>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder={CURRENCIES[formData.currency]?.placeholder || "0.00"}
                step="0.01"
                className={`w-full bg-gray-800 border ${
                  errors.amount ? "border-red-500" : "border-gray-700"
                } rounded-md py-2 pl-8 pr-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Description{" "}
              {lineItems.some((item) => item.description) &&
                "(Optional if using line items)"}
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Transaction description"
              className={`w-full bg-gray-800 border ${
                errors.description ? "border-red-500" : "border-gray-700"
              } rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
          </div>
        </div>

        {/* Category and Payment Method */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              {categories[formData.transactionType]?.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Payment Method
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reference and Tax Deductible */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Reference Number
            </label>
            <input
              type="text"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              placeholder="Invoice, receipt, or check number"
              className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center h-full pt-6">
            <input
              type="checkbox"
              id="taxDeductible"
              name="taxDeductible"
              checked={formData.taxDeductible}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-700 rounded bg-gray-800"
            />
            <label
              htmlFor="taxDeductible"
              className="ml-2 block text-sm text-gray-400"
            >
              Tax Deductible
            </label>
          </div>
        </div>

        {/* Line Items Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-medium text-white">
              Line Items (Optional)
            </h3>
            <button
              type="button"
              onClick={addLineItem}
              className="flex items-center text-sm text-blue-400 hover:text-blue-300"
            >
              <Plus size={16} className="mr-1" />
              Add Item
            </button>
          </div>

          <div className="space-y-3">
            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-start">
                <div className="col-span-5">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      handleLineItemChange(index, "description", e.target.value)
                    }
                    placeholder="Item description"
                    className={`w-full bg-gray-800 border ${
                      errors[`lineItem_${index}_description`]
                        ? "border-red-500"
                        : "border-gray-700"
                    } rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  />
                  {errors[`lineItem_${index}_description`] && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors[`lineItem_${index}_description`]}
                    </p>
                  )}
                </div>

                <div className="col-span-3">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      {getCurrencySymbol(formData.currency)}
                    </span>
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) =>
                        handleLineItemChange(index, "amount", e.target.value)
                      }
                      placeholder={CURRENCIES[formData.currency]?.placeholder || "0.00"}
                      step="0.01"
                      className={`w-full bg-gray-800 border ${
                        errors[`lineItem_${index}_amount`]
                          ? "border-red-500"
                          : "border-gray-700"
                      } rounded-md py-2 pl-8 pr-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    />
                  </div>
                  {errors[`lineItem_${index}_amount`] && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors[`lineItem_${index}_amount`]}
                    </p>
                  )}
                </div>

                <div className="col-span-3">
                  <select
                    value={item.category}
                    onChange={(e) =>
                      handleLineItemChange(index, "category", e.target.value)
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Category</option>
                    {categories[formData.transactionType]?.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => removeLineItem(index)}
                    disabled={lineItems.length === 1}
                    className={`p-2 rounded-full ${
                      lineItems.length === 1
                        ? "text-gray-600 cursor-not-allowed"
                        : "text-red-400 hover:bg-gray-800"
                    }`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            placeholder="Additional notes or details"
            className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          ></textarea>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              setFormData({
                transactionType: "expense",
                date: new Date().toISOString().split("T")[0],
                amount: "",
                description: "",
                category: "",
                paymentMethod: "cash",
                reference: "",
                taxDeductible: false,
                notes: "",
                currency: formData.currency, // Preserve current currency selection
              });
              setLineItems([{ description: "", amount: "", category: "" }]);
              setErrors({});
            }}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 flex items-center"
          >
            <X size={16} className="mr-1" />
            Clear
          </button>

          <button
            type="submit"
            className="px-6 py-2 bg-yellow-400 text-white rounded-md hover:opacity-90 flex items-center"
          >
            <Save size={16} className="mr-2" />
            Save Transaction
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManualDataInput;
