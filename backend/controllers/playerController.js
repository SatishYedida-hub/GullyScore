exports.getPlayers = async (req, res, next) => {
  try {
    res.status(200).json({ message: 'getPlayers not implemented', data: [] });
  } catch (error) {
    next(error);
  }
};

exports.getPlayerById = async (req, res, next) => {
  try {
    res.status(200).json({ message: 'getPlayerById not implemented', data: null });
  } catch (error) {
    next(error);
  }
};

exports.createPlayer = async (req, res, next) => {
  try {
    res.status(201).json({ message: 'createPlayer not implemented', data: null });
  } catch (error) {
    next(error);
  }
};

exports.updatePlayer = async (req, res, next) => {
  try {
    res.status(200).json({ message: 'updatePlayer not implemented', data: null });
  } catch (error) {
    next(error);
  }
};

exports.deletePlayer = async (req, res, next) => {
  try {
    res.status(200).json({ message: 'deletePlayer not implemented' });
  } catch (error) {
    next(error);
  }
};
