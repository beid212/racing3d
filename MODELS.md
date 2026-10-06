# Модели: откуда взять и как подключить

В игре заранее настроены 10 слотов машин и 3 слота деревьев. Если файла нет, слот рисуется встроенной моделью.
Формат — только **GLB** (или glTF в одном файле). Игра сама подгоняет длину, центр, посадку на землю и красит кузов в цвет игрока (по названию материала: paint/body/carpaint).

## Слоты
| Файл | Машина в игре | Что искать |
|---|---|---|
| models/cars/car01.glb | Спорткар | sports car |
| models/cars/car02.glb | Болид | formula race car |
| models/cars/car03.glb | Внедорожник | suv, offroad jeep |
| models/cars/car04.glb | Хэтчбек | hatchback |
| models/cars/car05.glb | Мускул-кар | muscle car |
| models/cars/car06.glb | Купе GT | coupe, gt car |
| models/cars/car07.glb | Раллийная | rally car |
| models/cars/car08.glb | Пикап | pickup truck |
| models/cars/car09.glb | Суперкар | supercar |
| models/cars/car10.glb | Классика | classic retro car |
| models/props/tree.glb | Дерево (Лесная петля) | low poly tree |
| models/props/cactus.glb | Кактус (Дюны) | cactus |
| models/props/pine.glb | Ёлка (Снежные зубцы) | pine tree |

## Sketchfab
1. Зарегистрируйтесь (бесплатно) и откройте поиск с фильтром «Downloadable»:
   https://sketchfab.com/search?features=downloadable&type=models&q=sports+car
2. На странице модели проверьте лицензию. CC0 — без условий. CC-BY — нужно указать автора (впишите в CREDITS.md).
   Модели с лицензиями «NonCommercial» и «NoDerivatives» используйте осторожно: обработка размера и перекраска считаются изменением.
3. Скачайте в формате **glTF/GLB** (кнопка Download 3D Model) и переименуйте файл под слот.
4. Если модель повёрнута неверно или слишком мелкая, подправьте в js/config.js поля машины:
   `yaw` (поворот в радианах), `flip:true` (развернуть на 180°), `scale` (множитель размера), `len` (длина).
5. Модели в формате Draco-сжатия или с KHR-расширениями без поддержки в GLTFLoader могут не загрузиться. Тогда останется встроенная машина.

## Бесплатно без регистрации (CC0)
Наборы Kenney: Car Kit (40+ low-poly машин в glTF) и Toy Car Kit, лицензия CC0:
https://kenney-assets.itch.io/car-kit
Они стилизованные, не фотореалистичные. Для деревьев подойдёт Kenney Nature Kit. Берите отдельные .glb из папки Models/GLTF format.

## Ограничения
- Для моделей из Sketchfab колёса не крутятся и не поворачиваются (у таких моделей нет единой структуры). Крен и клевки кузова работают.
- Файлы должны лежать рядом с проектом. Опубликованная страница Claude (artifact) внешние файлы не загружает, поэтому проект запускается локально.
