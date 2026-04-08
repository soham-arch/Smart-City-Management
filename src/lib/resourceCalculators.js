export function computeFireResources(intensity, buildingType) {
  let trucks;
  let firefighters;
  let tankers;

  if (intensity <= 3) {
    trucks = 1;
    firefighters = 5;
    tankers = 1;
  } else if (intensity <= 6) {
    trucks = 2;
    firefighters = 10;
    tankers = 2;
  } else if (intensity <= 9) {
    trucks = 3;
    firefighters = 15;
    tankers = 3;
  } else {
    trucks = 5;
    firefighters = 25;
    tankers = 5;
  }

  if (buildingType === 'industrial' || buildingType === 'commercial') {
    trucks = Math.ceil(trucks * 1.3);
    firefighters = Math.ceil(firefighters * 1.2);
    tankers = Math.ceil(tankers * 1.3);
  }

  return { trucks, firefighters, tankers, spreadRadius: intensity * 15 };
}

export function computePoliceResources(severity, crowdSize) {
  let vehicles;
  let officers;
  let backup;

  if (severity <= 3) {
    vehicles = 1;
    officers = 2;
    backup = false;
  } else if (severity <= 6) {
    vehicles = 2;
    officers = 4;
    backup = false;
  } else {
    vehicles = Math.min(severity - 4, 5);
    officers = Math.max(6, severity);
    backup = true;
  }

  const crowdMultiplier = crowdSize === 'Large' ? 1.5 : crowdSize === 'Medium' ? 1.2 : 1;
  vehicles = Math.ceil(vehicles * crowdMultiplier);
  officers = Math.ceil(officers * crowdMultiplier);

  return { vehicles, officers, backup };
}
