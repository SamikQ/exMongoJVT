const { v4: uuidv4 } = require("uuid"); // бібліотечка для генерації унікального ІД
const { validationResult } = require("express-validator"); // додаємо метод Валідейшн резалт який працює в парі з Валідатором в places-routes;

const HttpError = require("../models/http-error");
const getCoordsForAddress = require("../util/location");

const Place = require("../models/place");

let DUMMY_PLACES = [
  {
    id: "p1",
    title: "Empire State Building",
    description: "one of the most famous sky crapers in the world!",
    location: {
      lat: 40.7484474,
      lng: -73.9871516,
    },
    address: "NY 10001",
    creator: "u1",
  },
];

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid; // { pid: p1} <--- так відпрацьовує метод експресу params на req

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("something went wrong!", 500);
    return next(error); // не забуваємо преривати код, якщо пішла помилка
  }

  if (!place) {
    const error = new HttpError("Could not find a place for provided ID!"); // throw --- тригерить ерор хендлер мідлвейр який ми створили в апп з 4 параметрами
    return next(error);
    // next(error);  <---- обовязково використовувати next(), якщо працюємо з БД та асинхронним кодом
  }

  res.json({ place: place.toObject({ getters: true }) }); // toObject - перетворюємо респонс в нормальний JS код. getters:true - прибирає нижне підчеркнення в ід (специфіка Мангуса)
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid; // { pid: p1} <--- так відпрацьовує метод експресу params на req

  let places;

  try {
    places = await Place.find({ creator: userId });
  } catch (err) {
    const error = new HttpError("something went wrong!", 500);
    return next(error);
  }

  if (!places || places.length === 0) {
    return next(new HttpError("Could not find  places for provided ID!"), 404); // next не прериває подальше виконання коду, тому треба return
  }

  res.json({
    places: places.map((place) => place.toObject({ getters: true })), // при методі find приходить массив. Тому необхідно його перебрати і переробити в обьекти
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req); // передаємо реквест до функції Валідатору, яка перевірить, чи виконані умови, зазначені в роутсах
  if (!errors.isEmpty()) {
    //next() ОБОВЯЗКОВЕ ВИКОРИСТАННЯ ЗАМІСТЬ THROW який не буде працювати корректно, Так як працюємо з асинхронним кодом
    next(new HttpError("Invalid inputs passed, please check your data.", 422));
  }

  const { title, description, address, creator } = req.body; //визначаємо необхідні елементи з тіла запиту

  let coordinates;
  // getCoordsForAddress може видати помилку, тому нам треба робити це через try catch
  try {
    coordinates = getCoordsForAddress(address);
  } catch (error) {
    return next(error); // Прериваємо код і перенаправляємо помилку далі в нашу спеціальну функцію
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: "https://treeplantation.com/images/articles/banana-tree.png",
    creator,
  });

  try {
    await createdPlace.save(); // save функція яка зберігає щось в БД
  } catch (err) {
    const error = new HttpError("Creating place failed, try again", 500);
    return next(error);
  }
  res.status(201).json({ place: createdPlace }); // код 201 - за конвецією, якщо ми щось додаємо
};

const updatePlaceById = async (req, res, next) => {
  const errors = validationResult(req); // передаємо реквест до функції Валідатору, яка перевірить, чи виконані умови, зазначені в роутсах
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid inputs passed, please check your data.", 422);
  }
  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("something went wrong", 500);
    return next(error);
  }

  // оновлюємо параметри, які хочемо оновити
  place.title = title;
  place.description = description;

  try {
    await place.save(); // зберігаємо оновлений обєкт (плейс)
  } catch (err) {
    const error = new HttpError("something went wrong", 500);
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) }); // повертаємо респонс (200, так як ми нічого нового не створювали)
};

const deletePlaceById = async (req, res, next) => {
  //варіант видалення елементу з масиву по уроку: (можна видаляти лише зі змінної let)
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("coulnd find place by ID", 500);
    return next(error);
  }

  try {
    await place.deleteOne(); // зберігаємо оновлений обєкт (плейс)
  } catch (err) {
    const error = new HttpError("Coulnd remove the place", 500);
    return next(error);
  }

  // мій варіант видалення елементу з массиву (можна видаляти зі змінної const)
  // const placeId = req.params.pid;
  // const placeIndex = DUMMY_PLACES.findIndex(item => item.id !== placeId);
  // DUMMY_PLACES.splice(placeIndex, 1);

  res.status(200).json({ message: "Succesfully removed" });
};

exports.getPlaceById = getPlaceById; // якщо поставити дужки в кінці, до функція буде викликана!
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlaceById = updatePlaceById;
exports.deletePlaceById = deletePlaceById;
