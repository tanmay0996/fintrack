import { ApiError } from "../utils/ApiError.js";

const requireRole = (...roles) => {
  return (req, _, next) => {
    if (!req.user) throw new ApiError(401, "Unauthorized request");
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, "You do not have permission to perform this action");
    }
    next();
  };
};

export { requireRole };
