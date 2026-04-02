import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import { CATEGORIES } from "../utils/constants";
import { X, DollarSign, Tag, Calendar, FileText, Loader2 } from "lucide-react";

const recordSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  type: z.enum(["INCOME", "EXPENSE"], { required_error: "Type is required" }),
  category: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

const FieldError = ({ message }) => (
  <AnimatePresence>
    {message && (
      <motion.p
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="text-xs text-rose-400 mt-1"
      >
        {message}
      </motion.p>
    )}
  </AnimatePresence>
);

const inputClass = (hasError) =>
  `w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-200 outline-none text-foreground placeholder:text-muted-foreground/40
  focus:ring-2 focus:ring-primary/40 focus:border-primary/50
  ${hasError
    ? "bg-rose-500/8 border border-rose-500/40"
    : "bg-white/5 border border-white/8 hover:border-white/15"}`;

const RecordForm = ({ open, onClose, record, onSaved }) => {
  const isEditing = !!record;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(recordSchema) });

  const typeValue = watch("type");
  const categoryValue = watch("category");

  useEffect(() => {
    if (open) {
      if (record) {
        reset({
          amount: record.amount,
          type: record.type,
          category: record.category,
          date: new Date(record.date).toISOString().split("T")[0],
          notes: record.notes || "",
        });
      } else {
        reset({ amount: "", type: "", category: "", date: "", notes: "" });
      }
    }
  }, [record, open]);

  const onSubmit = async (data) => {
    try {
      if (isEditing) {
        await api.patch(`/api/v1/records/${record.id}`, data);
        toast.success("Record updated");
      } else {
        await api.post("/api/v1/records", data);
        toast.success("Record created");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to save record");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: "oklch(0.115 0.022 265)", border: "1px solid oklch(0.93 0.008 240 / 10%)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid oklch(0.93 0.008 240 / 8%)" }}>
              <div>
                <h2 className="text-base font-semibold text-foreground">{isEditing ? "Edit Record" : "New Record"}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{isEditing ? "Update transaction details" : "Add a new financial transaction"}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
                onClick={onClose}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/8 transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {/* Amount + Type row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
                    <input type="number" step="0.01" placeholder="0.00" {...register("amount")}
                      className={`pl-8 ${inputClass(!!errors.amount)}`} />
                  </div>
                  <FieldError message={errors.amount?.message} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Type</label>
                  <div className="flex gap-2">
                    {["INCOME", "EXPENSE"].map((t) => (
                      <motion.button
                        key={t}
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setValue("type", t, { shouldValidate: true })}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                          typeValue === t
                            ? t === "INCOME"
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                              : "bg-rose-500/20 border-rose-500/40 text-rose-400"
                            : "bg-white/5 border-white/8 text-muted-foreground hover:border-white/15"
                        }`}
                      >
                        {t === "INCOME" ? "↑ In" : "↓ Out"}
                      </motion.button>
                    ))}
                  </div>
                  <FieldError message={errors.type?.message} />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => (
                    <motion.button
                      key={c}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setValue("category", c, { shouldValidate: true })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 border ${
                        categoryValue === c
                          ? "bg-primary/25 border-primary/50 text-primary"
                          : "bg-white/5 border-white/7 text-muted-foreground hover:text-foreground hover:border-white/15"
                      }`}
                    >
                      {c}
                    </motion.button>
                  ))}
                </div>
                <FieldError message={errors.category?.message} />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
                  <input type="date" {...register("date")} className={`pl-9 ${inputClass(!!errors.date)}`} />
                </div>
                <FieldError message={errors.date?.message} />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Notes <span className="text-muted-foreground/40">(optional)</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
                  <textarea
                    rows={2}
                    placeholder="Add a note..."
                    {...register("notes")}
                    className={`pl-8 resize-none ${inputClass(false)}`}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-muted-foreground transition-colors"
                  style={{ background: "oklch(0.93 0.008 240 / 6%)", border: "1px solid oklch(0.93 0.008 240 / 10%)" }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? "Update" : "Create"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RecordForm;
