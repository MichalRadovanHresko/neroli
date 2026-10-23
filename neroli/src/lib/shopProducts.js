import beakerImage from "../assets/images/shop/baker.png";
import glassesImage from "../assets/images/shop/glasses.jpg";
import pipetteImage from "../assets/images/shop/pippet.jpg";
import scaleImage from "../assets/images/shop/scale.png";

export const PRODUCTS = [
  {
    name: "Pipette Dropper",
    image: pipetteImage,
    purchaseUrl: "https://www.bulkapothecary.com/pipette-dropper/",
  },
  {
    name: "Measuring Beakers",
    image: beakerImage,
    purchaseUrl: "https://www.bulkapothecary.com/measuring-beakers/",
  },
  {
    name: "Safety Glasses",
    image: glassesImage,
    purchaseUrl: "https://www.bulkapothecary.com/safety-glasses/",
  },
  {
    name: "Scale",
    image: scaleImage,
    purchaseUrl:
      "https://www.bulkapothecary.com/compact-digital-platform-scale/",
  },
];

export const findShopProduct = (name) =>
  PRODUCTS.find(
    (product) => product.name.toLowerCase() === String(name ?? "").trim().toLowerCase(),
  );

export const resolveEquipment = (item) => {
  const product = findShopProduct(item.name);
  return product ? { ...item, image_url: product.image } : item;
};
