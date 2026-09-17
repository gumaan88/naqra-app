-- Initial Curated Content Seed for Naqra Platform
-- Rich Arabic vocabulary with Levels 1-5, and vector illustration SVGs for Game 2 (Word & Image)

-- Default settings
INSERT OR REPLACE INTO app_settings (key, value) VALUES
('platform_name', 'نقرأ'),
('max_distractors_lvl1', '3'),
('hint_error_threshold', '3'),
('completion_points', '10'),
('correct_letter_points', '2'),
('first_pass_bonus', '5'),
('zero_hints_bonus', '3');

-- Words Level 1: 2-3 Letters
INSERT OR REPLACE INTO words (id, text, normalized_text, category, difficulty_level, is_imageable, image_url, source, status, created_at, approved_at) VALUES
('w_01', 'أب', 'أب', 'عائلة', 1, 1, '/assets/images/words/dad.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_02', 'أم', 'أم', 'عائلة', 1, 1, '/assets/images/words/mom.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_03', 'أخ', 'أخ', 'عائلة', 1, 1, '/assets/images/words/brother.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_04', 'باب', 'باب', 'المنزل', 1, 1, '/assets/images/words/door.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_05', 'دب', 'دب', 'حيوانات', 1, 1, '/assets/images/words/bear.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_06', 'فم', 'فم', 'جسم', 1, 1, '/assets/images/words/mouth.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_07', 'يد', 'يد', 'جسم', 1, 1, '/assets/images/words/hand.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_08', 'أسد', 'أسد', 'حيوانات', 1, 1, '/assets/images/words/lion.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_09', 'قط', 'قط', 'حيوانات', 1, 1, '/assets/images/words/cat.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_10', 'بط', 'بط', 'طيور', 1, 1, '/assets/images/words/duck.svg', 'curated', 'approved', datetime('now'), datetime('now'));

-- Words Level 2: 3 Letters
INSERT OR REPLACE INTO words (id, text, normalized_text, category, difficulty_level, is_imageable, image_url, source, status, created_at, approved_at) VALUES
('w_11', 'قلم', 'قلم', 'أدوات', 2, 1, '/assets/images/words/pen.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_12', 'علم', 'علم', 'أشياء', 2, 1, '/assets/images/words/flag.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_13', 'شمس', 'شمس', 'طبيعة', 2, 1, '/assets/images/words/sun.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_14', 'قمر', 'قمر', 'طبيعة', 2, 1, '/assets/images/words/moon.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_15', 'نجم', 'نجم', 'طبيعة', 2, 1, '/assets/images/words/star.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_16', 'عين', 'عين', 'جسم', 2, 1, '/assets/images/words/eye.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_17', 'تمر', 'تمر', 'طعام', 2, 1, '/assets/images/words/dates.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_18', 'خبز', 'خبز', 'طعام', 2, 1, '/assets/images/words/bread.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_19', 'نمل', 'نمل', 'حيوانات', 2, 1, '/assets/images/words/ant.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_20', 'ورد', 'ورد', 'طبيعة', 2, 1, '/assets/images/words/rose.svg', 'curated', 'approved', datetime('now'), datetime('now'));

-- Words Level 3: 4 Letters
INSERT OR REPLACE INTO words (id, text, normalized_text, category, difficulty_level, is_imageable, image_url, source, status, created_at, approved_at) VALUES
('w_21', 'كتاب', 'كتاب', 'أدوات', 3, 1, '/assets/images/words/book.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_22', 'تفاح', 'تفاح', 'فواكه', 3, 1, '/assets/images/words/apple.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_23', 'حليب', 'حليب', 'طعام', 3, 1, '/assets/images/words/milk.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_24', 'أرنب', 'أرنب', 'حيوانات', 3, 1, '/assets/images/words/rabbit.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_25', 'سماء', 'سماء', 'طبيعة', 3, 1, '/assets/images/words/sky.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_26', 'شجرة', 'شجرة', 'طبيعة', 3, 1, '/assets/images/words/tree.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_27', 'ساعة', 'ساعة', 'أدوات', 3, 1, '/assets/images/words/clock.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_28', 'طائر', 'طائر', 'طيور', 3, 1, '/assets/images/words/bird.svg', 'curated', 'approved', datetime('now'), datetime('now'));

-- Words Level 4: 4-5 Letters
INSERT OR REPLACE INTO words (id, text, normalized_text, category, difficulty_level, is_imageable, image_url, source, status, created_at, approved_at) VALUES
('w_29', 'سيارة', 'سيارة', 'مركبات', 4, 1, '/assets/images/words/car.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_30', 'طائرة', 'طائرة', 'مركبات', 4, 1, '/assets/images/words/plane.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_31', 'حديقة', 'حديقة', 'أماكن', 4, 1, '/assets/images/words/garden.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_32', 'مدرسة', 'مدرسة', 'أماكن', 4, 1, '/assets/images/words/school.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_33', 'سفينة', 'سفينة', 'مركبات', 4, 1, '/assets/images/words/ship.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_34', 'فراشة', 'فراشة', 'حشرات', 4, 1, '/assets/images/words/butterfly.svg', 'curated', 'approved', datetime('now'), datetime('now'));

-- Words Level 5: 5-6 Letters
INSERT OR REPLACE INTO words (id, text, normalized_text, category, difficulty_level, is_imageable, image_url, source, status, created_at, approved_at) VALUES
('w_35', 'برتقال', 'برتقال', 'فواكه', 5, 1, '/assets/images/words/orange.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_36', 'دراجة', 'دراجة', 'مركبات', 5, 1, '/assets/images/words/bicycle.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_37', 'زرافة', 'زرافة', 'حيوانات', 5, 1, '/assets/images/words/giraffe.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_38', 'طاووس', 'طاووس', 'طيور', 5, 1, '/assets/images/words/peacock.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_39', 'حاسوب', 'حاسوب', 'تقنية', 5, 1, '/assets/images/words/computer.svg', 'curated', 'approved', datetime('now'), datetime('now')),
('w_40', 'سلحفاة', 'سلحفاة', 'حيوانات', 5, 1, '/assets/images/words/turtle.svg', 'curated', 'approved', datetime('now'), datetime('now'));
