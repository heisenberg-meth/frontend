import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
export default function Select({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  searchable = false,
  icon: IconComponent = null,
  className = "",
  style = {},
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);
  const searchRef = useRef(null);

  const selectedOption = options.find((o) => o.value === value);
  const filteredOptions = searchable
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()),
      )
    : options;

  const handleTriggerClick = useCallback(() => {
    setIsOpen((prev) => !prev);
    setSearch("");
  }, []);

  const handleOptionClick = useCallback(
    (optionValue) => {
      onChange(optionValue);
      setIsOpen(false);
      setSearch("");
    },
    [onChange],
  );

  useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen, searchable]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={`custom-select-wrapper ${className}`}
      ref={wrapperRef}
      style={style}
    >
      <div
        className={`custom-select-trigger ${isOpen ? "open" : ""}`}
        onClick={handleTriggerClick}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleTriggerClick();
          }
        }}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {IconComponent && selectedOption?.icon ? (
          <span className="trigger-icon">{selectedOption.icon}</span>
        ) : IconComponent ? (
          <span className="trigger-icon">
            <IconComponent size={16} />
          </span>
        ) : null}
        <span style={{ flex: 1 }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          style={{
            color: "var(--primary)",
            transition: "transform 0.25s ease",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="custom-select-menu"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            role="listbox"
          >
            {searchable && (
              <input
                required
                ref={searchRef}
                className="custom-select-search"
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
              />
            )}
            <div className="custom-select-options">
              {filteredOptions.length === 0 ? (
                <div className="custom-select-no-results">No results found</div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`custom-select-option ${option.value === value ? "selected" : ""}`}
                    onClick={() => handleOptionClick(option.value)}
                    role="option"
                    aria-selected={option.value === value}
                  >
                    {option.icon && (
                      <span className="option-icon">{option.icon}</span>
                    )}
                    <span>{option.label}</span>
                    {option.value === value && (
                      <span className="option-check">
                        <Check size={16} />
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
